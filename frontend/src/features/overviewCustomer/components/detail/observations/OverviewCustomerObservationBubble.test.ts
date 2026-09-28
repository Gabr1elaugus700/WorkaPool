import React from "react";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { formatIsoDateTimeLabel } from "@/utils/formatDate";
import type { OverviewCustomerObservation } from "../../../types/overviewCustomerObservation.types";
import { OverviewCustomerObservationBubble } from "./OverviewCustomerObservationBubble";

function buildObservation(
  overrides: Partial<OverviewCustomerObservation> = {},
): OverviewCustomerObservation {
  return {
    id: "obs-1",
    customerCode: 1234,
    authorUserId: "user-1",
    authorDisplayName: "Maria Souza",
    body: "Cliente pediu retorno\nna próxima semana",
    createdAt: "2026-09-28T13:05:00.000Z",
    updatedAt: "2026-09-28T13:05:00.000Z",
    editedAt: null,
    ...overrides,
  };
}

function render(observation: OverviewCustomerObservation, isOwn: boolean): string {
  return renderToStaticMarkup(
    React.createElement(OverviewCustomerObservationBubble, { observation, isOwn }),
  );
}

describe("OverviewCustomerObservationBubble", () => {
  it("aligns own observations to the right", () => {
    const markup = render(buildObservation(), true);

    assert.match(markup, /data-own="true"/);
    assert.match(markup, /ml-auto/);
    assert.doesNotMatch(markup, /mr-auto/);
  });

  it("aligns observations from others to the left", () => {
    const markup = render(buildObservation(), false);

    assert.match(markup, /data-own="false"/);
    assert.match(markup, /mr-auto/);
    assert.doesNotMatch(markup, /ml-auto/);
  });

  it("renders author, body and pt-BR timestamp", () => {
    const observation = buildObservation();
    const markup = render(observation, false);

    assert.match(markup, /Maria Souza/);
    assert.match(markup, /Cliente pediu retorno\nna próxima semana/);
    assert.match(markup, /whitespace-pre-wrap/);
    assert.match(markup, /dateTime="2026-09-28T13:05:00.000Z"/);
    assert.ok(markup.includes(formatIsoDateTimeLabel(observation.createdAt)));
  });

  it("shows the edited label only when editedAt is set", () => {
    const edited = render(buildObservation({ editedAt: "2026-09-28T14:00:00.000Z" }), true);
    const original = render(buildObservation(), true);

    assert.match(edited, /editado/);
    assert.doesNotMatch(original, /editado/);
  });

  it("falls back to a generic author label when display name is empty", () => {
    const markup = render(buildObservation({ authorDisplayName: "" }), false);

    assert.match(markup, /Usuário/);
  });
});
