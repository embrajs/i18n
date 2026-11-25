import { computed, derived, type Owned, type Readable, type Writable, writable } from "@embra/reactivity";

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
    const p = fetcher(initialLang);
    const fallback = options?.fallback;
    const fb = fallback && fallback !== initialLang && fetcher(fallback);
    const locales: Record<LocaleLang, Locale> = { [initialLang]: await p };
    if (fb) {
      locales[fallback] = await fb;
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
  private readonly _l: Readable<FlatLocale>;

  /** @internal */
  private readonly _b?: Readable<Locale | false>;

  /** @internal */
  private _s = 0;

  public constructor(initialLang: LocaleLang, locales: Locales, options?: I18nOptions) {
    this.fetcher = options?.fetcher;
    const fallback = options?.fallback;

    this.locales$ = writable(locales);

    this.lang$ = writable(initialLang);

    this.locale$ = derived([this.locales$, this.lang$], (locale, lang) => locale[lang]);

    this._l = derived(this.locale$, flattenLocale);

    this._b = fallback
      ? derived([this.locales$, this.lang$], (locales, lang) => fallback !== lang && locales[fallback])
      : undefined;

    this.t$ = computed(() =>
      translate.bind(
        this._l.value,
        new Map(),
        this._b && this._b.value && translate.bind(flattenLocale(this._b.value), new Map(), ""),
      ),
    );
  }

  /**
   * Change language.
   *
   * @returns — a promise that resolves when the new locale is fetched.
   */
  public async switchLang(lang: LocaleLang): Promise<void> {
    const seq = ++this._s;
    if (!this.locales$.get()[lang] && this.fetcher) {
      this.addLocale(lang, await this.fetcher(lang));
    }
    if (seq === this._s) {
      (this.lang$ as Writable<LocaleLang>).set(lang);
    }
  }

  /**
   * @returns — boolean indicating whether a message with the specified key in current language exists or not.
   */
  public hasKey(key: string): boolean {
    return this._l.get()[key] !== undefined;
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
    (this.lang$ as Owned<Readable>).dispose();
    (this.t$ as Owned<Readable>).dispose();
    (this.locales$ as Owned<Writable>).dispose();
    (this.locale$ as Owned<Readable>).dispose();
    (this._l as Owned<Readable>).dispose();
    (this._b as Owned<Readable> | undefined)?.dispose();
  }
}

function translate(
  this: FlatLocale,
  localeFns: LocaleTemplateMessageFns,
  fallbackT: TFunction | null | "" | false | undefined,
  key: string,
  args?: TFunctionArgs,
): string {
  let rawKey = key;
  if (args) {
    const modifier = args["@"];
    if (modifier != null) {
      const modifierKey = `${key}@${modifier}`;
      if (this[modifierKey] !== undefined) {
        rawKey = modifierKey;
      }
    }
    if (this[rawKey] !== undefined) {
      let fn = localeFns.get(rawKey);
      fn ?? localeFns.set(rawKey, (fn = createTemplateMessageFn(this[rawKey])));
      if (fn) {
        return fn(args);
      }
    }
  }
  return this[rawKey] ?? (fallbackT ? fallbackT(key, args) : key);
}
