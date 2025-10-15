import { type Readable } from "@embra/reactivity";

export type LocaleLang = string;

export type LocaleLangObservable = Readable<LocaleLang>;

export type Locale = { readonly [key: string]: string | Locale };

export type Locales = { readonly [lang: LocaleLang]: Locale };

export type TFunctionArgs = {
  readonly [key: string | number]: any;
  /**
   * Modifier matching.
   * @see {@link https://github.com/embrajs/i18n#modifier-matching}
   */
  readonly ["@"]?: string | number;
};

/**
 * @param keyPath Dot-separated key path to the locale message, e.g. `"a.b.c"`
 * @param args Optional arguments for interpolation
 * @returns locale message or `keyPath` if not found
 */
export type TFunction = (keyPath: string, args?: TFunctionArgs) => string;

export type TFunctionObservable = Readable<TFunction>;

export interface LocaleFetcher {
  (lang: LocaleLang): Promise<Locale> | Locale;
}
