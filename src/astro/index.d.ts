import type { I18n, Locale, LocaleLang, Locales, TFunction } from "@embra/i18n";
import type { AstroComponentFactory } from "astro/runtime/server/index.js";

export interface CreateStaticI18nOptions {
  /** Locales available during the static build. */
  locales: Locales;
  /** Default language and fallback language if the current language doesn't have the requested key. */
  fallback: LocaleLang;
}

export type StaticI18n = Pick<I18n, "lang" | "locale" | "locales" | "t" | "hasKey"> & {
  readonly lang: LocaleLang;
  readonly locale: Locale;
  readonly locales: Locales;
};

export interface StaticI18nHelpers {
  getI18n(lang?: LocaleLang): StaticI18n;
  getT(lang?: LocaleLang): TFunction;
}

/**
 * Create cached i18n helpers for Astro static pages.
 *
 * Each language gets its own `I18n` instance so parallel static rendering does not
 * share mutable language state between pages.
 */
export declare function createStaticI18n(options: CreateStaticI18nOptions): StaticI18nHelpers;

export interface TransProps {
  /**
   * Translation template. Placeholders use `{{name}}` and are filled by Astro slots with the same name.
   * When there is only one placeholder, the default slot can be used instead.
   *
   * @example
   * ```astro
   * <Trans message="a{{b}}c">
   *   <strong>B</strong>
   * </Trans>
   * ```
   */
  message: string;
}

/**
 * Insert Astro slots into the translation message.
 *
 * @example
 * ```astro
 * <Trans message="a{{b}}c{{d}}e">
 *   <h1 slot="b">B</h1>
 *   <p slot="d">D</p>
 * </Trans>
 * ```
 *
 * Outputs:
 *
 * ```html
 * a<h1>B</h1>c<p>D</p>e
 * ```
 *
 * The default slot can be used when there is only one placeholder.
 *
 * @example
 * ```astro
 * <Trans message="a{{b}}c">
 *   <h1>B</h1>
 * </Trans>
 * ```
 *
 * Outputs:
 *
 * ```html
 * a<h1>B</h1>c
 * ```
 */
export declare const Trans: AstroComponentFactory & ((props: TransProps) => unknown);
