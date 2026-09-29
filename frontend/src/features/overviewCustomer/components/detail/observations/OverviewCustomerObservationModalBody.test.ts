import React from "react";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import type { OverviewCustomerObservation } from "../../../types/overviewCustomerObservation.types";
import { OverviewCustomerObservationModalBody } from "./OverviewCustomerObservationModalBody";

const CURRENT_USER_ID = "user-me";

const observation: OverviewCustomerObservation = {
  id: "obs-1",
  customerCode: 1234,
  authorUserId: CURRENT_USER_ID,
  authorDisplayName: "Eu Mesmo",
  body: "Cliente pediu retorno na sexta",
  createdAt: "2026-09-28T13:05:00.000Z",
  updatedAt: "2026-09-28T13:05:00.000Z",
  editedAt: null,
};

function render(
  overrides: Partial<React.ComponentProps<typeof OverviewCustomerObservationModalBody>> = {},
): string {
  return renderToStaticMarkup(
    React.createElement(OverviewCustomerObservationModalBody, {
      items: [],
      currentUserId: CURRENT_USER_ID,
      isLoading: false,
      isError: false,
      onRetry: () => undefined,
      draft: "",
      onDraftChange: () => undefined,
      onSubmit: () => undefined,
      canSubmit: false,
      isSubmitting: false,
      submitError: null,
      ...overrides,
    }),
  );
}

describe("OverviewCustomerObservationModalBody", () => {
  it("shows only the loading state while the thread is loading", () => {
    const markup = render({ isLoading: true, items: [observation] });

    assert.match(markup, /Carregando histórico/);
    assert.doesNotMatch(markup, /data-own=/);
    assert.doesNotMatch(markup, /Nova observação/);
  });

  it("shows the error copy and retry without fabricated messages or composer", () => {
    const markup = render({ isError: true, items: [observation] });

    assert.match(markup, /Não foi possível carregar o histórico/);
    assert.match(markup, /Tentar novamente/);
    assert.doesNotMatch(markup, /data-own=/);
    assert.doesNotMatch(markup, /Cliente pediu retorno/);
    assert.doesNotMatch(markup, /Nova observação/);
  });

  it("shows the empty state with the composer available", () => {
    const markup = render();

    assert.match(markup, /Nenhuma observação neste cliente/);
    assert.match(markup, /aria-label="Nova observação"/);
  });

  it("renders the thread and the composer when observations load", () => {
    const markup = render({ items: [observation], draft: "Rascunho", canSubmit: true });

    assert.match(markup, /Cliente pediu retorno na sexta/);
    assert.match(markup, /data-own="true"/);
    assert.match(markup, /Rascunho/);
    assert.ok(markup.indexOf("Cliente pediu retorno") < markup.indexOf("Nova observação"));
  });
});
