import React from "react";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { OverviewCustomerObservationComposer } from "./OverviewCustomerObservationComposer";

type ComposerProps = React.ComponentProps<typeof OverviewCustomerObservationComposer>;

function render(overrides: Partial<ComposerProps> = {}): string {
  const props: ComposerProps = {
    value: "",
    onChange: () => {},
    onSubmit: () => {},
    canSubmit: false,
    isSubmitting: false,
    error: null,
    ...overrides,
  };
  return renderToStaticMarkup(React.createElement(OverviewCustomerObservationComposer, props));
}

function submitButton(markup: string): string {
  const match = markup.match(/<button[^>]*>/);
  assert.ok(match, "expected a submit button");
  return match[0];
}

describe("OverviewCustomerObservationComposer", () => {
  it("renders a labelled textarea with the draft value and the body limit", () => {
    const markup = render({ value: "Retornar na segunda" });

    assert.match(markup, /<textarea[^>]*aria-label="Nova observação"/);
    assert.match(markup, /maxLength="2000"/);
    assert.match(markup, />Retornar na segunda<\/textarea>/);
  });

  it("disables the submit button when the draft cannot be sent", () => {
    const button = submitButton(render({ canSubmit: false }));

    assert.match(button, /\sdisabled=""/);
  });

  it("enables the submit button when the draft can be sent", () => {
    const button = submitButton(render({ value: "Ok", canSubmit: true }));

    assert.doesNotMatch(button, /\sdisabled=""/);
  });

  it("shows the submit error only when present", () => {
    const withError = render({ error: "Não foi possível enviar a observação" });
    const withoutError = render();

    assert.match(withError, /role="alert"[^>]*>Não foi possível enviar a observação/);
    assert.doesNotMatch(withoutError, /role="alert"/);
  });

  it("signals the in-flight state on the submit button", () => {
    const markup = render({ value: "Ok", isSubmitting: true });

    assert.match(markup, /Enviando/);
  });
});
