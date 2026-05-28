import type { AstroComponentFactory } from "astro/runtime/server/index.js";

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
