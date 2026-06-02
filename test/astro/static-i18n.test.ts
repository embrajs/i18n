import { createStaticI18n, type StaticI18n } from "@embra/i18n/astro";
import { describe, expect, it } from "vitest";

type HasSwitchLang = "switchLang" extends keyof StaticI18n ? true : false;

type RequiredKeys<T> = { [K in keyof T]-?: Record<string, never> extends Pick<T, K> ? never : K }[keyof T];

type HasRequiredFallback = "fallback" extends RequiredKeys<Parameters<typeof createStaticI18n>[0]> ? true : false;

const staticI18nHasNoSwitchLang: HasSwitchLang = false;
const staticI18nFallbackIsRequired: HasRequiredFallback = true;

const locales = {
  en: {
    apple: "apple",
    banana: "banana",
    eat: "{{name}} eats {{fruit}}.",
    "orange@1": "An orange",
    orange: "{{@}} oranges",
  },
  zh: {
    apple: "苹果",
  },
};

describe("createStaticI18n", () => {
  it("should get t by lang", () => {
    const { getT } = createStaticI18n({ locales, fallback: "en" });

    expect(getT("en")("apple")).toBe("apple");
    expect(getT("zh")("apple")).toBe("苹果");
    expect(getT("en")("eat", { fruit: "apple", name: "CRIMX" })).toBe("CRIMX eats apple.");
    expect(getT("en")("orange", { "@": 1 })).toBe("An orange");
    expect(getT("en")("orange", { "@": 3 })).toBe("3 oranges");
  });

  it("should get i18n by lang", () => {
    const { getI18n } = createStaticI18n({ locales, fallback: "en" });

    const enI18n = getI18n("en");
    const zhI18n = getI18n("zh");

    expect(enI18n.lang).toBe("en");
    expect(zhI18n.lang).toBe("zh");
    expect(enI18n.t("apple")).toBe("apple");
    expect(zhI18n.t("apple")).toBe("苹果");
  });

  it("should cache each lang instance", () => {
    const { getI18n, getT } = createStaticI18n({ locales, fallback: "en" });

    expect(getI18n("en")).toBe(getI18n("en"));
    expect(getI18n("en")).not.toBe(getI18n("zh"));
    expect(getT("en")).toBe(getT("en"));
  });

  it("should support fallback language", () => {
    const { getT } = createStaticI18n({ locales, fallback: "en" });

    expect(getT("zh")("apple")).toBe("苹果");
    expect(getT("zh")("banana")).toBe("banana");
  });

  it("should use fallback as default lang", () => {
    const { getI18n, getT } = createStaticI18n({ locales, fallback: "en" });

    expect(getI18n().lang).toBe("en");
    expect(getT()("apple")).toBe("apple");
    expect(getT(undefined)("apple")).toBe("apple");
    expect(staticI18nFallbackIsRequired).toBe(true);
  });

  it("should expose a static i18n type without mutable APIs", () => {
    const { getI18n } = createStaticI18n({ locales, fallback: "en" });
    const i18n: StaticI18n = getI18n("en");

    expect(i18n.t("apple")).toBe("apple");
    expect(staticI18nHasNoSwitchLang).toBe(false);
  });
});
