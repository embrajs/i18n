import {
  compute,
  type OwnedReadable,
  type OwnedWritable,
  type Readable,
  type Writable,
  writable,
} from "@embra/reactivity";

import { type FlatLocale, flattenLocale } from "./flat-locales";
import type { Locale, LocaleFetcher, LocaleLang, Locales, TFunction, TFunctionArgs } from "./interface";
import { createTemplateMessageFn, type LocaleTemplateMessageFns } from "./template-message";

export interface I18nOptions {
  /** Fetch locale of the specified lang. */
  fetcher?: LocaleFetcher;
  /** Fallback language if the current language doesn't have the requested key. */
  fallback?: LocaleLang;
}

export class I18n {
  /** Fetch locale of `initialLang` and return an I18n instance with the locale. */
  public static async preload(
    initialLang: LocaleLang,
    fetcher: LocaleFetcher,
    options?: Omit<I18nOptions, "fetcher">,
  ): Promise<I18n> {
    const locales = { [initialLang]: await fetcher(initialLang) };
    const fallback = options?.fallback;
    if (fallback && fallback !== initialLang) {
      locales[fallback] = await fetcher(fallback);
    }
    return new I18n(initialLang, locales, { ...options, fetcher });
  }

  /** A {@link Readable} of current lang. */
  public readonly lang$: Readable<LocaleLang>;

  /** Current lang. */
  public get lang(): LocaleLang {
    return this.lang$.get();
  }

  /** A {@link Readable} of current translate function. */
  public readonly t$: Readable<TFunction>;

  /** Translation function that uses the current `t$` function. */
  public readonly t: TFunction = (keyPath, args) => this.t$.get()(keyPath, args);

  /** Fetch locale of the specified lang. */
  public fetcher?: LocaleFetcher;

  /** A {@link Writable} of all loaded locales. */
  public readonly locales$: Writable<Locales>;

  /** All loaded locales. */
  public get locales(): Locales {
    return this.locales$.get();
  }

  /** A {@link Readable} of current locale. */
  public readonly locale$: Readable<Locale>;

  /** Current locale */
  public get locale(): Locale {
    return this.locale$.get();
  }

  /** @internal */
  private readonly _flatLocale$_: Readable<FlatLocale>;

  public constructor(initialLang: LocaleLang, locales: Locales, options?: I18nOptions) {
    this.fetcher = options?.fetcher;
    const fallback = options?.fallback;

    this.locales$ = writable(locales);

    this.lang$ = writable(initialLang);

    this.locale$ = compute((get) => get(this.locales$)[get(this.lang$)]);

    this._flatLocale$_ = compute((get) => flattenLocale(get(this.locale$)));

    const fallbackLocale$ = fallback && compute((get) => fallback !== get(this.lang$) && get(this.locales$)[fallback]);

    this.t$ = compute((get) =>
      translate.bind(
        get(this._flatLocale$_),
        new Map(),
        get(fallbackLocale$) && translate.bind(flattenLocale(get(fallbackLocale$) as Locale), new Map(), ""),
      ),
    );
  }

  /**
   * Change language.
   *
   * @returns — a promise that resolves when the new locale is fetched.
   */
  public async switchLang(lang: LocaleLang): Promise<void> {
    if (!this.locales$.get()[lang] && this.fetcher) {
      this.addLocale(lang, await this.fetcher(lang));
    }
    (this.lang$ as Writable<LocaleLang>).set(lang);
  }

  /**
   * @returns — boolean indicating whether a message with the specified key in current language exists or not.
   */
  public hasKey(key: string): boolean {
    return !!this._flatLocale$_.get()[key];
  }

  /**
   * Add a locale to the locales.
   *
   * Use `i18n.locales$.set()` for more control.
   */
  public addLocale(lang: LocaleLang, locale: Locale): void {
    this.locales$.set({ ...this.locales, [lang]: locale });
  }

  public dispose(): void {
    (this.lang$ as OwnedReadable).dispose();
    (this.t$ as OwnedReadable).dispose();
    (this.locales$ as OwnedWritable).dispose();
    (this.locale$ as OwnedReadable).dispose();
    (this._flatLocale$_ as OwnedReadable).dispose();
  }
}

function translate(
  this: FlatLocale,
  localeFns: LocaleTemplateMessageFns,
  fallbackT: TFunction | null | "" | false | undefined,
  key: string,
  args?: TFunctionArgs,
): string {
  if (args) {
    const modifier = args["@"];
    if (modifier != null) {
      const modifierKey = `${key}@${modifier}`;
      if (this[modifierKey]) {
        key = modifierKey;
      }
    }
    if (this[key]) {
      let fn = localeFns.get(key);
      fn ?? localeFns.set(key, (fn = createTemplateMessageFn(this[key])));
      if (fn) {
        return fn(args);
      }
    }
  }
  return this[key] || (fallbackT && fallbackT(key, args)) || key;
}
