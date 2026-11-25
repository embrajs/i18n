---

name: embra-i18n
description: Reactive internationalization with @embra/i18n. Use when working in files that import @embra/i18n or when implementing localization, dynamic locale loading, pluralization, or translated UI in TypeScript, React, or Astro.
---

# @embra/i18n

For exact TypeScript signatures and JSDoc, read `node_modules/@embra/i18n/dist/{index,react}.d.mts` and `node_modules/@embra/i18n/src/astro/index.d.ts`.

**Not provided** (do not invent or assume): no ICU MessageFormat (pluralization uses `@` modifier keys), no built-in persistence or URL routing, no client-side reactivity in `@embra/i18n/astro` (use a framework island).

## 1. Entrypoints

| Entry Point         | Purpose                                                                      |
| ------------------- | ---------------------------------------------------------------------------- |
| `@embra/i18n`       | `I18n`, `detectLang`, locale types, reactive `lang$` / `t$` / `locales$`     |
| `@embra/i18n/react` | `I18nProvider`, `useTranslate`, `useLang`, `useI18n`, React `<Trans>`        |
| `@embra/i18n/astro` | `createStaticI18n` and Astro `<Trans>` for static/server-rendered Astro HTML |

## 2. Core Translation Model & Dynamic Loading

- Locale keys can be nested objects and are flattened to dot-separated paths (e.g. `stock.fruit`).
- Template placeholders use `{{name}}` (object args) or `{{0}}` (array args). Missing placeholders are preserved verbatim so `<Trans>` can fill them later.
- Pluralization and variants use `@` modifier keys (e.g. `apple@0`, `apple@1`), matched via `{ "@": count }` and falling back to the base key (`apple`).
- `i18n.lang$`, `i18n.t$`, `i18n.locales$`, and `i18n.locale$` are `@embra/reactivity` observables (use `.subscribe(fn, { immediate: false })` or `.get()`).
- Use `I18n.preload(initialLang, fetcher, options?)` for async locales, `switchLang(lang)` to fetch-on-demand and switch, `addLocale(lang, locale)` to add a locale, and `hasKey(key)` to check key existence.

```ts
import { detectLang, I18n, type Locales } from "@embra/i18n";

const locales: Locales = {
  en: {
    stock: { fruit: "apple" },
    eat: "{{name}} eats {{fruit}}.",
    apple: "{{@}} apples",
    "apple@0": "No apple",
    "apple@1": "An apple",
  },
};

const i18n = new I18n("en", locales, { fallback: "en" });
i18n.t("stock.fruit"); // "apple"
i18n.t("eat", { fruit: "apple", name: "CRIMX" }); // "CRIMX eats apple."
i18n.t("apple", { "@": 1 }); // "An apple"
i18n.t("apple", { "@": 3 }); // "3 apples"

// Async preload & language detection
const preloaded = await I18n.preload(detectLang(["en", "zh-CN"]) || "en", (lang) => import(`./locales/${lang}.json`), {
  fallback: "en",
});
await preloaded.switchLang("zh-CN");
```

## 3. React (`@embra/i18n/react`)

- Wrap components with `<I18nProvider i18n={i18n}>`. Nest multiple `<I18nProvider>` components for cascading fallback (inner misses fall back to outer providers).
- Use `useTranslate(optional?)`, `useLang(optional?)`, and `useI18n(optional?)` inside React components so UI re-renders when language or locales change. Pass `optional = true` to return `undefined` instead of throwing when outside a provider.
- Use `<Trans message={t("eat")}>` with `data-t-slot="name"` on child elements. When there is only one placeholder, `data-t-slot` can be omitted.

```tsx
import { I18n } from "@embra/i18n";
import { I18nProvider, Trans, useTranslate } from "@embra/i18n/react";

function Message() {
  const t = useTranslate();
  return (
    <Trans message={t("eat")}>
      <strong data-t-slot="name">{t("author")}</strong>
      <i data-t-slot="fruit">{t("fruit")}</i>
    </Trans>
  );
}

<I18nProvider i18n={new I18n("en", locales)}>
  <Message />
</I18nProvider>;
```

## 4. Astro (`@embra/i18n/astro`)

- Use `createStaticI18n({ locales, fallback })` in Astro frontmatter (`fallback` is required and acts as both the default language and missing-key fallback).
- It returns cached `{ getI18n, getT }` helpers with one isolated `I18n` instance per language so parallel static rendering never shares mutable language state.
- Use Astro `<Trans>` with named slots (`slot="name"`) or the default slot when there is only one placeholder.

```astro
---
import { createStaticI18n, Trans } from "@embra/i18n/astro";

const { getT } = createStaticI18n({ locales, fallback: "en" });
const t = getT(Astro.params.lang);
---

<h1>{t("title")}</h1>
<Trans message={t("eat")}>
  <strong slot="name">{t("author")}</strong>
  <i slot="fruit">{t("fruit")}</i>
</Trans>
```

## 5. Design Contracts

- **Missing keys**: `t(keyPath)` checks the active locale, then `fallback` (if configured), and returns `keyPath` if neither exists.
- **Missing `<Trans>` slots**: unresolved placeholders in both React and Astro `<Trans>` render back as `{{name}}`.
- **Reactive updates in React**: always read translations via `useTranslate()` rather than calling `i18n.t` directly inside render so components subscribe to `t$`.
- **Disposal**: call `i18n.dispose()` when tearing down short-lived `I18n` instances to dispose internal reactive nodes (`lang$`, `t$`, `locales$`, `locale$`).
