import { afterEach, describe, expect, it, vi } from "vitest";

import { detectLang } from "../src";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("detectLang", () => {
  it("should detect language", () => {
    const lang = detectLang();
    expect(lang).toBeTruthy();
    expect(typeof lang).toBe("string");
  });

  it("should match given tags case insensitively", () => {
    const localeUpper = detectLang().toUpperCase();
    expect(detectLang(["example", localeUpper, "fr"])).toBe(localeUpper);

    const localeLower = localeUpper.toLowerCase();
    expect(detectLang(["example", localeLower, "fr"])).toBe(localeLower);
  });

  it("should return null if no match", () => {
    const lang2 = detectLang(["example", "example2"]);
    expect(lang2).toBe(null);
  });

  it("should match given sub-tags case insensitively", () => {
    const localeUpper = detectLang().split("-")[0].toUpperCase();
    expect(detectLang(["example", localeUpper, "fr"])).toBe(localeUpper);

    const localeLower = localeUpper.toLowerCase();
    expect(detectLang(["example", localeLower, "fr"])).toBe(localeLower);
  });

  it("should not match partial sub-tag prefixes", () => {
    const locale = detectLang();
    expect(detectLang([locale[0]])).toBe(null);
  });

  it("should prefer most specific matching tag regardless of order", () => {
    vi.stubGlobal("navigator", { languages: ["en-US"] });
    expect(detectLang(["en", "en-US"])).toBe("en-US");
    expect(detectLang(["en-US", "en"])).toBe("en-US");
  });

  it("should respect navigator.languages preference order", () => {
    vi.stubGlobal("navigator", { languages: ["fr", "zh-CN", "en"] });
    expect(detectLang()).toBe("fr");
    expect(detectLang(["en", "zh-CN"])).toBe("zh-CN");
  });

  it("should fall back to Intl.DateTimeFormat when navigator.languages is unavailable", () => {
    const intlLocale = Intl.DateTimeFormat().resolvedOptions().locale;

    vi.stubGlobal("navigator", undefined);
    expect(detectLang()).toBe(intlLocale);

    vi.stubGlobal("navigator", { languages: [] });
    expect(detectLang()).toBe(intlLocale);
  });
});
