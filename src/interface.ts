import { type Readable } from "@embra/reactivity";

export type LocaleLang = string;

export type LocaleLangObservable = Readable<LocaleLang>;

export type Locale = { readonly [key: string]: string | Locale };

export type Locales = { readonly [lang: LocaleLang]: Locale };

/** Optional `args` object for t function */
export type TFunctionArgs = {
  readonly [key: string | number]: any;
  readonly ["@"]?: string | number;
};

/**
 * Get locale message by key-path(`"a.b.c"`) with optional arguments for interpolation
 * @returns locale message or empty string if not found
 */
export type TFunction = (keyPath: string, args?: TFunctionArgs) => string;

export type TFunctionObservable = Readable<TFunction>;

export interface LocaleFetcher {
  (lang: LocaleLang): Promise<Locale> | Locale;
}
