import React from "react";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import type { OverviewCustomerObservation } from "../../../types/overviewCustomerObservation.types";
import { prependOlderObservations } from "../../../utils/overviewCustomerObservationsState.utils";
import { OverviewCustomerObservationThread } from "./OverviewCustomerObservationThread";

const CURRENT_USER_ID = "user-me";

function buildObservation(
  overrides: Partial<OverviewCustomerObservation> = {},
): OverviewCustomerObservation {
  return {
    id: "obs-1",
    customerCode: 1234,
    authorUserId: CURRENT_USER_ID,
    authorDisplayName: "Eu Mesmo",
    body: "Primeira",
    createdAt: "2026-09-28T13:05:00.000Z",
    updatedAt: "2026-09-28T13:05:00.000Z",
    editedAt: null,
    ...overrides,
  };
}

function render(items: OverviewCustomerObservation[]): string {
  return renderToStaticMarkup(
    React.createElement(OverviewCustomerObservationThread, {
      items,
      currentUserId: CURRENT_USER_ID,
    }),
  );
}

describe("OverviewCustomerObservationThread", () => {
  it("shows the empty state copy and no bubbles when there are no observations", () => {
    const markup = render([]);

    assert.match(markup, /Nenhuma observação neste cliente/);
    assert.doesNotMatch(markup, /data-own=/);
  });

  it("renders bubbles in the received (ascending) order", () => {
    const markup = render([
      buildObservation({ id: "obs-1", body: "Primeira" }),
      buildObservation({
        id: "obs-2",
        body: "Segunda",
        createdAt: "2026-09-28T14:05:00.000Z",
      }),
    ]);

    assert.doesNotMatch(markup, /Nenhuma observação neste cliente/);
    assert.ok(markup.indexOf("Primeira") < markup.indexOf("Segunda"));
  });

  it("marks only the logged-in user's observations as own", () => {
    const markup = render([
      buildObservation({ id: "obs-1", body: "Minha" }),
      buildObservation({
        id: "obs-2",
        authorUserId: "user-other",
        authorDisplayName: "Vendedor",
        body: "Do vendedor",
      }),
    ]);

    const flags = [...markup.matchAll(/data-own="(true|false)"/g)].map((match) => match[1]);
    assert.deepEqual(flags, ["true", "false"]);
  });

  it("puts only the bubble matching editingId in edit mode", () => {
    const markup = renderToStaticMarkup(
      React.createElement(OverviewCustomerObservationThread, {
        items: [
          buildObservation({ id: "obs-1", body: "Primeira" }),
          buildObservation({ id: "obs-2", body: "Segunda" }),
        ],
        currentUserId: CURRENT_USER_ID,
        edit: {
          editingId: "obs-2",
          draft: "Segunda revisada",
          error: null,
          isSaving: false,
          canSave: true,
          onStart: () => {},
          onDraftChange: () => {},
          onCancel: () => {},
          onSave: () => {},
        },
      }),
    );

    assert.equal(markup.match(/<textarea/g)?.length, 1);
    assert.match(markup, /Segunda revisada/);
    assert.match(markup, /Primeira/);
  });

  it("exposes the thread as an accessible log", () => {
    const markup = render([buildObservation()]);

    assert.match(markup, /role="log"/);
    assert.match(markup, /aria-label="Histórico de observações"/);
  });
});

describe("OverviewCustomerObservationThread load older", () => {
  const LOAD_OLDER_LABEL = "Carregar observações anteriores";
  const all = Array.from({ length: 60 }, (_, index) => {
    const createdAt = new Date(Date.UTC(2026, 8, 1, 12, index)).toISOString();
    return buildObservation({
      id: `obs-${index}`,
      body: `Mensagem número ${index}.`,
      createdAt,
      updatedAt: createdAt,
    });
  });
  const newest = all.slice(10);
  const older = all.slice(0, 10);

  function renderPage(
    items: OverviewCustomerObservation[],
    props: { hasOlder: boolean; isLoadingOlder?: boolean },
  ): string {
    return renderToStaticMarkup(
      React.createElement(OverviewCustomerObservationThread, {
        items,
        currentUserId: CURRENT_USER_ID,
        onLoadOlder: () => {},
        ...props,
      }),
    );
  }

  it("shows the load-older control above the first bubble when older pages exist", () => {
    const markup = renderPage(newest, { hasOlder: true });

    assert.match(markup, new RegExp(LOAD_OLDER_LABEL));
    assert.ok(markup.indexOf(LOAD_OLDER_LABEL) < markup.indexOf("Mensagem número 10."));
    assert.equal(markup.match(/data-own=/g)?.length, 50);
  });

  it("hides the control when there is no older page", () => {
    const markup = renderPage(newest, { hasOlder: false });

    assert.doesNotMatch(markup, new RegExp(LOAD_OLDER_LABEL));
  });

  it("renders the 10 older messages on top of the 50 newest after prepending", () => {
    const page = prependOlderObservations(
      { items: newest, hasOlder: true, nextBefore: { createdAt: newest[0]!.createdAt, id: newest[0]!.id } },
      { items: older, hasOlder: false, nextBefore: null },
    );
    const markup = renderPage(page.items, { hasOlder: page.hasOlder });

    assert.equal(markup.match(/data-own=/g)?.length, 60);
    assert.ok(markup.indexOf("Mensagem número 0.") < markup.indexOf("Mensagem número 9."));
    assert.ok(markup.indexOf("Mensagem número 9.") < markup.indexOf("Mensagem número 10."));
    assert.doesNotMatch(markup, new RegExp(LOAD_OLDER_LABEL));
  });

  it("disables the control while the older page is loading", () => {
    const markup = renderPage(newest, { hasOlder: true, isLoadingOlder: true });

    assert.match(markup, /<button[^>]*disabled=""[^>]*>Carregando…<\/button>/);
    assert.doesNotMatch(markup, new RegExp(LOAD_OLDER_LABEL));
  });
});
