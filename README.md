# [@embra/i18n](https://github.com/embrajs/i18n)

<p align="center">
  <img width="200" src="https://raw.githubusercontent.com/embrajs/i18n/main/assets/logo.svg">
</p>

[![Docs](https://img.shields.io/badge/Docs-read-%23fdf9f5)](https://embrajs.github.io/i18n)
[![Build Status](https://github.com/embrajs/i18n/actions/workflows/build.yml/badge.svg)](https://github.com/embrajs/i18n/actions/workflows/build.yml)
[![npm-version](https://img.shields.io/npm/v/@embra/i18n.svg)](https://www.npmjs.com/package/@embra/i18n)
[![Coverage Status](https://embrajs.github.io/i18n/coverage-badges/@embra/i18n.svg)](https://embrajs.github.io/i18n/coverage/)

A lightweight, reactive internationalization library.

## Install

```bash
npm add @embra/reactivity @embra/i18n
```

## Features

- Subscribable reactive `lang$`, `t$` and `locales$`.
- Lightweight and fast `t()` translation.
- Nested locale messages.
- Message formatting and pluralization.
- Easy dynamic locale loading.
- Locale namespaces.
- First-class React support.

## Usage

Create an I18n instance with static locales:

```ts
import { I18n, type Locales } from "@embra/i18n";

const locales: Locales = {
  en: {
    stock: {
      fruit: "apple",
    },
  },
};

const i18n = new I18n("en", locales);
i18n.t("stock.fruit"); // apple

// add more locales later
const zhCN = await import(`./locales/zh-CN.json`);
i18n.addLocale("zh-CN", zhCN);

// or replace all locales manually
const zhTW = await import(`./locales/zh-TW.json`);
i18n.locales$.set({ "zh-TW": zhTW });
```

You can also create an `I18n` instance with preloaded dynamic locales:

```ts
import { I18n } from "@embra/i18n";

const i18n = await I18n.preload("en", lang => import(`./locales/${lang}.json`));
// Locale `./locales/en.json` is preloaded

await i18n.switchLang("zh-CN"); // Locale `./locales/zh-CN.json` is loaded
```

### Detect Language

You can detect language of browser/nodejs via `detectLang`. [BCP 47 tags and sub-tags](https://www.rfc-editor.org/rfc/rfc4647.html#section-3.4) are supported.

```ts
import { detectLang } from "@embra/i18n";

detectLang(); // "en-US"

const i18n = await I18n.preload(
  // language sub-tag is matched
  detectLang(["en", "zh-CN"]) || "zh-TW", // "en"
  lang => import(`./locales/${lang}.json`),
);
```

### Message Formatting

Message keys are surrounded by double curly brackets:

```ts
import { I18n, type Locales } from "@embra/i18n";

const locales: Locales = {
  en: {
    stock: {
      fruit: "apple",
    },
    fav_fruit: "I love {{fruit}}",
  },
};

const i18n = new I18n("en", locales);
const fruit = i18n.t("stock.fruit"); // apple
i18n.t("fav_fruit", { fruit }); // I love apple
```

It also works with array:

```ts
import { I18n, type Locales } from "@embra/i18n";

const locales: Locales = {
  en: {
    fav_fruit: "I love {{0}} and {{1}}",
  },
};

const i18n = new I18n("en", locales);
i18n.t("fav_fruit", ["apple", "banana"]); // I love apple and banana
```

### Pluralization

You can easily do pluralization with [Modifier Matching](#modifier-matching).

```ts
import { I18n, type Locales } from "@embra/i18n";

const locales: Locales = {
  en: {
    apple: "{{@}} apples", // fallback
    "apple@0": "No apple", // matching { "@": 0 } or { "@": "0" }
    "apple@1": "An apple", // matching { "@": 1 } or { "@": "1" }
  },
};

const i18n = new I18n("en", locales);
i18n.t("apples", { "@": 0 }); // No apple
i18n.t("apples", { "@": 1 }); // An apple
i18n.t("apples", { "@": 3 }); // 3 apples
```

### Modifier Matching

You can use `@` to match different modifiers.

For example:

```ts
i18n.t("a.b.c", { "@": "d" });
```

It will look for `"a.b.c@d"` and fallback to `"a.b.c"` if not found.

See [Pluralization](#pluralization) for more examples.

### Reactive I18n

`i18n.lang$`, `i18n.t$` and `i18n.locales$` are subscribable values.

See [@embra/reactivity](https://github.com/embrajs/reactivity) for more details.

```js
i18n.lang$.reaction(lang => {
  // logs lang on changed
  console.log(lang);
});

i18n.lang$.subscribe(lang => {
  // logs lang immediately and on changed
  console.log(lang);
});
```

### Namespace

I18n instance is cheap to create. You can create multiple instances for different namespaces.

```ts
import { I18n } from "@embra/i18n";

// Module Login
async function moduleLogin() {
  const i18n = await I18n.preload("en", lang => import(`./locales/login/${lang}.json`));

  console.log(i18n.t("password"));
}

// Module About
async function moduleAbout() {
  const i18n = await I18n.preload("en", lang => import(`./locales/about/${lang}.json`));

  console.log(i18n.t("author"));
}
```

## Hot Module Replacement

To use [Vite HMR](https://vitejs.dev/guide/api-hmr.html) for locales:

```ts
const i18n = await I18n.preload("en", lang => import(`./locales/${lang}.json`));

if (import.meta.hot) {
  import.meta.hot.accept(["./locales/en.json", "./locales/zh-CN.json"], ([en, zhCN]) => {
    i18n.locales$.set({
      ...i18n.locales,
      en: en?.default || i18n.locales.en,
      "zh-CN": zhCN?.default || i18n.locales["zh-CN"],
    });
  });
}
```

## Dynamic Import

Although you can simply use `import()` to dynamically load locales, with bundler API you can do more.

For example with Vite you can use [glob import](https://vitejs.dev/guide/features.html#glob-import) to statically get info of all locales.
This way allows you to add or remove locales without changing source code.

```ts
import { I18n, detectLang, type Locale, type LocaleLang } from "@embra/i18n";

export const i18nLoader = (): Promise<I18n> => {
  const localeModules = import.meta.glob<boolean, string, Locale>("./locales/*.json", { import: "default" });

  const localeLoaders = Object.keys(localeModules).reduce(
    (loaders, path) => {
      if (localeModules[path]) {
        const langMatch = path.match(/\/([^/]+)\.json$/);
        if (langMatch) {
          loaders[langMatch[1]] = localeModules[path];
        }
      }
      return loaders;
    },
    {} as Record<LocaleLang, () => Promise<Locale>>,
  );

  const langs = Object.keys(localeLoaders);

  return I18n.preload(detectLang(langs) || (localeLoaders.en ? "en" : langs[0]), lang => localeLoaders[lang]());
};
```

## React

- `<I18nProvider>` to provide `i18n` context for descendant components.
- `useTranslate` hook to subscribe and get the latest `i18n.t`.
- `useLang` hook to subscribe and get the latest `i18n.lang`.
- `useI18n` hook to subscribe and get the latest `i18n` instance.
- `<Trans>` component to insert React elements into translation template messages.

```tsx
import { I18n } from "@embra/i18n";
import { I18nProvider, useTranslate } from "@embra/i18n/react";

const i18n = new I18n("en", { en: { fruit: "apple" } });

const MyComponent = () => {
  const t = useTranslate();
  return <div>{t("fruit")}</div>;
};

const App = () => {
  return (
    <I18nProvider i18n={i18n}>
      <MyComponent />
    </I18nProvider>
  );
};
```

### Cascading I18nProvider

You can nest multiple `<I18nProvider>`s to create cascading i18n contexts.

```tsx
import { I18n } from "@embra/i18n";
import { I18nProvider, useTranslate } from "@embra/i18n/react";

const baseI18n = new I18n("en", { en: { confirm: "Confirm" } });
const loginI18n = new I18n("en", { en: { login: "Login" } });

const MyComponent = () => {
  const t = useTranslate();
  return (
    <div>
      <button>{t("confirm")}</button>
      <button>{t("login")}</button>
    </div>
  );
};

const App = () => {
  return (
    <I18nProvider i18n={baseI18n}>
      <I18nProvider i18n={loginI18n}>
        <MyComponent />
      </I18nProvider>
    </I18nProvider>
  );
};
```

### Trans Component

To insert React elements into the translation message:

```tsx
import { I18n, I18nProvider } from "@embra/i18n";
import { Trans, useTranslate } from "@embra/i18n/react";

const locales = {
  en: {
    author: "CRIMX",
    fruit: "apple",
    eat: "{{name}} eats {{fruit}}.",
  },
};

const i18n = new I18n("en", locales);

const MyComponent = () => {
  const t = useTranslate();

  return (
    <Trans message={t("eat")}>
      <strong data-t-slot="name">{t("author")}</strong>
      <i style={{ color: "red" }} data-t-slot="fruit">
        {t("fruit")}
      </i>
    </Trans>
  );
};

const App = () => {
  return (
    <I18nProvider i18n={i18n}>
      <MyComponent />
    </I18nProvider>
  );
};
```

↓Outputs:

```tsx
<>
  <strong data-t-slot="name">CRIMX</strong> eats <i style={{ color: "red" }} data-t-slot="fruit">apple</i>.
<>
```

`data-t-slot` can be ignored if there is only one placeholder.

```tsx
<Trans message="a{{b}}c">
  <h1>B</h1>
</Trans>
```

↓Outputs:

```tsx
<>
  a<h1>B</h1>c
</>
```

## VSCode Extension

`@embra/i18n` is compatible with [i18n Ally](https://github.com/lokalise/i18n-ally), a popular VSCode extension for i18n. You can use it to manage your locale files.
