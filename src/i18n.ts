import {
  compute,
  type OwnedReadable,
  type OwnedWritable,
  type Readable,
  writable,
  type Writable,
} from "@embra/reactivity";

import { type FlatLocale, flattenLocale } from "./flat-locales";
import {
  type Locale,
  type LocaleFetcher,
  type LocaleLang,
  type Locales,
  type TFunction,
  type TFunctionArgs,
} from "./interface";
import { createTemplateMessageFn, type LocaleTemplateMessageFns } from "./template-message";

export interface I18nOptions {
  /** Fetch locale of the specified lang. */
  fetcher: LocaleFetcher;
}

export class I18n {
  /** Fetch locale of `initialLang` and return an I18n instance with the locale. */
  public static async preload(initialLang: LocaleLang, fetcher: LocaleFetcher): Promise<I18n> {
    return new I18n(initialLang, { [initialLang]: await fetcher(initialLang) }, { fetcher });
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

    const localeFns: LocaleTemplateMessageFns = new Map();

    this.locales$ = writable(locales);

    this.lang$ = writable(initialLang);

    this.locale$ = compute(get => get(this.locales$)[get(this.lang$)] || {});

    this._flatLocale$_ = compute(get => flattenLocale(get(this.locale$)));

    this.t$ = compute(get =>
      ((flatLocale: FlatLocale, key: string, args?: TFunctionArgs): string => {
        if (args) {
          const modifier = args["@"];
          if (modifier != null) {
            const modifierKey = `${key}@${modifier}`;
            if (flatLocale[modifierKey]) {
              key = modifierKey;
            }
          }
          if (flatLocale[key]) {
            let fn = localeFns.get(key);
            fn ?? localeFns.set(key, (fn = createTemplateMessageFn(flatLocale[key])));
            if (fn) {
              return fn(args);
            }
          }
        }
        return flatLocale[key] || key;
      }).bind(localeFns.clear(), get(this._flatLocale$_)),
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
