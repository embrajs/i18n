import { describe, it, expect } from "vitest";

import { type LocaleFetcher, type Locales, I18n } from "../src";

describe("i18n", () => {
  it("smoke test", () => {
    const locales: Locales = { en: { name: "CRIMX" } };
    const i18n = new I18n("en", locales);
    expect(i18n.lang).toBe("en");
    expect(i18n.t("name")).toBe("CRIMX");
    i18n.dispose();
  });

  it("should support nested locale message", () => {
    const locales: Locales = {
      en: { daily: { fruit: { stock: "apple" } } },
    };
    const i18n = new I18n("en", locales);
    expect(i18n.t("daily.fruit.stock")).toBe("apple");
  });

  it("should not change i18n.t function when lang changes", async () => {
    const locales: Locales = {
      en: { apple: "apple" },
      zh: { apple: "苹果" },
    };
    const i18n = new I18n("en", locales);

    const enT = i18n.t;
    expect(i18n.t("apple")).toBe("apple");

    await i18n.switchLang("zh");
    expect(i18n.t).toBe(enT);
    expect(i18n.t("apple")).toBe("苹果");
  });

  it("should add locale", () => {
    const locales: Locales = {
      en: { apple: "apple" },
    };
    const i18n = new I18n("en", locales);

    expect(i18n.locale).toBe(locales.en);
    expect(i18n.lang).toBe("en");
    expect(i18n.t("apple")).toBe("apple");

    const zh = { apple: "苹果" };
    i18n.addLocale("zh", zh);

    expect(i18n.lang).toBe("en");
    expect(i18n.locale).toBe(locales.en);

    i18n.switchLang("zh");

    expect(i18n.lang).toBe("zh");
    expect(i18n.locale).toBe(zh);
    expect(i18n.t("apple")).toBe("苹果");
  });

  it("should check if message key-path exists", () => {
    const locales: Locales = {
      en: { apple: "apple", person: { name: "CRIMX" } },
    };
    const i18n = new I18n("en", locales);

    expect(i18n.hasKey("apple")).toBe(true);
    expect(i18n.hasKey("name")).toBe(false);
    expect(i18n.hasKey("person.name")).toBe(true);
  });
});

describe("locale loader", () => {
  it("should loaded locales asynchronously", async () => {
    const fakeLocaleFetcher: LocaleFetcher = async lang => {
      const locales: Locales = {
        en: { apple: "apple" },
        zh: { apple: "苹果" },
      };
      return locales[lang];
    };

    const i18n = await I18n.preload("en", fakeLocaleFetcher);

    expect(i18n.t("apple")).toBe("apple");

    await i18n.switchLang("zh");
    expect(i18n.t("apple")).toBe("苹果");
  });

  it("should support dynamic import", async () => {
    const i18n = await I18n.preload("en", lang => import(`./locales/${lang}.json`));

    expect(i18n.t("stock.fruit")).toBe("apple");

    await i18n.switchLang("zh");
    expect(i18n.t("stock.fruit")).toBe("苹果");
  });
});

describe("template t function", () => {
  it("should parse message template", () => {
    const locales: Locales = {
      en: { intro: "{{name}} eats {{fruit}}" },
    };
    const i18n = new I18n("en", locales);
    expect(i18n.t("intro", { name: "CRIMX", fruit: "apple" })).toBe("CRIMX eats apple");
  });

  it("should support array as args", () => {
    const locales: Locales = {
      en: { intro: "{{0}} eats {{1}}" },
    };
    const i18n = new I18n("en", locales);
    expect(i18n.t("intro", ["CRIMX", "apple"])).toBe("CRIMX eats apple");
  });

  it("should pick modifier message", () => {
    const locales: Locales = {
      en: {
        "apple@few": "Few apples",
        "apple@many": "Many apples",
      },
    };

    const option = (n: number) => (n <= 5 ? "few" : "many");

    const i18n = new I18n("en", locales);
    expect(i18n.t("apple", { "@": option(1) })).toBe("Few apples");
    expect(i18n.t("apple", { "@": option(6) })).toBe("Many apples");
  });

  it("should pick plural message", () => {
    const locales: Locales = {
      en: {
        apple: "{{@}} apples",
        "apple@0": "No apple",
        "apple@1": "An apple",
      },
    };
    const i18n = new I18n("en", locales);
    expect(i18n.t("apple", { "@": 0 })).toBe("No apple");
    expect(i18n.t("apple", { "@": 1 })).toBe("An apple");
    expect(i18n.t("apple", { "@": 3 })).toBe("3 apples");
  });

  it("should support @ without modifier keys", () => {
    const locales: Locales = {
      en: {
        message: "{{@}} world",
      },
    };
    const i18n = new I18n("en", locales);
    expect(i18n.t("message", { "@": "hello" })).toBe("hello world");
    expect(i18n.t("message", { "@": "bye" })).toBe("bye world");
  });

  it("should support @ with template message", () => {
    const locales: Locales = {
      en: {
        apple: "{{@}} apples in the {{place}}",
        "apple@0": "No apple in the {{place}}",
        "apple@1": "An apple in the {{place}}",
      },
    };
    const i18n = new I18n("en", locales);
    expect(i18n.t("apple", { "@": 0, place: "house" })).toBe("No apple in the house");
    expect(i18n.t("apple", { "@": 1, place: "house" })).toBe("An apple in the house");
    expect(i18n.t("apple", { "@": 3, place: "house" })).toBe("3 apples in the house");
  });

  it("should return key if message not exists", () => {
    const i18n = new I18n("en", {});
    expect(i18n.t("fruit")).toBe("fruit");
    expect(i18n.t("fruit", { fruit: "apple" })).toBe("fruit");
  });
});
