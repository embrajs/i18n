import { Trans } from "@embra/i18n/astro";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it } from "vitest";

const container = await AstroContainer.create();
const render = (message: string, slots?: Record<string, string>) =>
  container.renderToString(Trans, { props: { message }, slots });

describe("Astro Trans", () => {
  it("should render full message", async () => {
    expect(await render("abc")).toBe("abc");
  });

  it("should render named slots", async () => {
    expect(await render("{{name}} eats {{fruit}}.", { fruit: "<i>apple</i>", name: "<strong>CRIMX</strong>" })).toBe(
      "<strong>CRIMX</strong> eats <i>apple</i>.",
    );
  });

  it("should render default slot for one placeholder", async () => {
    expect(await render("a{{b}}c", { default: "<strong>B</strong>" })).toBe("a<strong>B</strong>c");
  });

  it("should keep missing placeholders", async () => {
    expect(await render("a{{b}}c")).toBe("a{{b}}c");
  });

  it("should escape message text and preserve slot html", async () => {
    expect(await render("{{x}} & <safe>", { x: "<strong>X</strong>" })).toBe("<strong>X</strong> &amp; &lt;safe&gt;");
  });
});
