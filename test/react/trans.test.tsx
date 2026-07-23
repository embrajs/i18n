// @vitest-environment jsdom

import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { I18n } from "../../src";
import { Trans } from "../../src/react";

describe("Trans", () => {
  it("should render nothing for empty message", () => {
    const { container } = render(<Trans message=""></Trans>);

    expect(container.innerHTML).toBe("");
  });

  it("should render full message", () => {
    const { container } = render(<Trans message="abc"></Trans>);

    expect(container.innerHTML).toBe("abc");
  });

  it("should render full message and ignore children", () => {
    const { container } = render(
      <Trans message="abc">
        <h1>Hello World</h1>
      </Trans>,
    );

    expect(container.innerHTML).toBe("abc");
  });

  it("should render var", () => {
    const { container } = render(
      <Trans message="a{{b}}c">
        <h1>B</h1>
      </Trans>,
    );

    expect(container.innerHTML).toBe("a<h1>B</h1>c");
  });

  it("should re-render var", () => {
    const { container, rerender } = render(
      <Trans message="a{{b}}c">
        <h1>B</h1>
      </Trans>,
    );

    rerender(
      <Trans message="a{{b}}c">
        <h1>BB</h1>
      </Trans>,
    );

    expect(container.innerHTML).toBe("a<h1>BB</h1>c");
  });

  it("should render vars on the side", () => {
    const { container } = render(
      <Trans message="{{a}}b{{c}}">
        <h1 data-t-slot="a">A</h1>
        <h1 data-t-slot="c">C</h1>
      </Trans>,
    );

    expect(container.innerHTML).toBe(`<h1 data-t-slot="a">A</h1>b<h1 data-t-slot="c">C</h1>`);
  });

  it("should render key if children not provided", () => {
    const { container } = render(<Trans message="a{{b}}c"></Trans>);

    expect(container.innerHTML).toBe("a{{b}}c");
  });

  it("should render keys if children not provided", () => {
    const { container } = render(
      <Trans message="{{a}}b{{c}}">
        <h1 data-t-slot="a">A</h1>
      </Trans>,
    );

    expect(container.innerHTML).toBe(`<h1 data-t-slot="a">A</h1>b{{c}}`);
  });

  it("should render placeholders left by partial translation", () => {
    const i18n = new I18n("en", {
      en: { message: "{{name}} has {{count}} apples" },
    });
    const { container } = render(
      <Trans message={i18n.t("message", { count: 3 })}>
        <strong data-t-slot="name">Alice</strong>
      </Trans>,
    );

    expect(container.innerHTML).toBe(`<strong data-t-slot="name">Alice</strong> has 3 apples`);
  });
});
