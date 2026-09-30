import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type {
  OverviewCustomerObservation,
  OverviewCustomerObservationCursor,
  OverviewCustomerObservationListResponse,
} from "../types/overviewCustomerObservation.types";
import {
  appendObservation,
  canSaveObservationEdit,
  canSubmitObservation,
  draftAfterObservationSubmitError,
  draftAfterObservationSubmitSuccess,
  isObservationListLoading,
  replaceObservation,
  resolveObservationEditError,
  resolveObservationSubmitError,
} from "./overviewCustomerObservationsState.utils";

const CURSOR: OverviewCustomerObservationCursor = {
  createdAt: "2026-09-27T11:00:00.000Z",
  id: "obs-older",
};

function observation(id: string, body = "texto"): OverviewCustomerObservation {
  return {
    id,
    customerCode: 123,
    authorUserId: "user-1",
    authorDisplayName: "Ana",
    body,
    createdAt: "2026-09-27T12:00:00.000Z",
    updatedAt: "2026-09-27T12:00:00.000Z",
    editedAt: null,
  };
}

describe("appendObservation", () => {
  it("appends to an empty list and to a missing page", () => {
    const created = observation("obs-1");
    const expected: OverviewCustomerObservationListResponse = {
      items: [created],
      hasOlder: false,
      nextBefore: null,
    };
    const empty: OverviewCustomerObservationListResponse = {
      items: [],
      hasOlder: false,
      nextBefore: null,
    };

    assert.deepEqual(appendObservation(empty, created), expected);
    assert.deepEqual(appendObservation(undefined, created), expected);
  });

  it("appends to the end of a non-empty list without mutating it", () => {
    const first = observation("obs-1", "primeira");
    const created = observation("obs-2", "segunda");
    const items = [first];
    const page: OverviewCustomerObservationListResponse = {
      items,
      hasOlder: false,
      nextBefore: null,
    };

    const next = appendObservation(page, created);

    assert.deepEqual(
      next.items.map((item) => item.id),
      ["obs-1", "obs-2"],
    );
    assert.equal(next.items[0], first);
    assert.equal(items.length, 1);
    assert.notEqual(next, page);
  });

  it("dedupes by id and keeps the existing page", () => {
    const existing = observation("obs-1", "original");
    const page: OverviewCustomerObservationListResponse = {
      items: [existing],
      hasOlder: true,
      nextBefore: CURSOR,
    };

    const next = appendObservation(page, observation("obs-1", "duplicado"));

    assert.equal(next, page);
    assert.equal(next.items[0]?.body, "original");
    assert.equal(next.hasOlder, true);
    assert.deepEqual(next.nextBefore, CURSOR);
  });

  it("preserves hasOlder and nextBefore when appending", () => {
    const next = appendObservation(
      {
        items: [observation("obs-2")],
        hasOlder: true,
        nextBefore: CURSOR,
      },
      observation("obs-3"),
    );

    assert.equal(next.hasOlder, true);
    assert.deepEqual(next.nextBefore, CURSOR);
    assert.deepEqual(
      next.items.map((item) => item.id),
      ["obs-2", "obs-3"],
    );
  });
});

describe("canSubmitObservation", () => {
  it("rejects an empty draft", () => {
    assert.equal(canSubmitObservation("", false), false);
  });

  it("rejects a whitespace-only draft", () => {
    assert.equal(canSubmitObservation(" \n\t ", false), false);
  });

  it("accepts a single visible character", () => {
    assert.equal(canSubmitObservation("a", false), true);
    assert.equal(canSubmitObservation("  a  ", false), true);
  });

  it("accepts a trimmed body of exactly 2000 characters", () => {
    assert.equal(canSubmitObservation("a".repeat(2000), false), true);
    assert.equal(canSubmitObservation(`  ${"a".repeat(2000)}  `, false), true);
  });

  it("rejects a trimmed body of 2001 characters", () => {
    assert.equal(canSubmitObservation("a".repeat(2001), false), false);
    assert.equal(canSubmitObservation(` ${"a".repeat(2001)} `, false), false);
  });

  it("rejects a valid draft while a submit is in flight", () => {
    assert.equal(canSubmitObservation("observação", true), false);
  });
});

describe("draft after submit", () => {
  it("clears the draft on success", () => {
    assert.equal(draftAfterObservationSubmitSuccess(), "");
  });

  it("keeps the typed draft on error", () => {
    const draft = "  Cliente pediu retorno amanhã  ";
    assert.equal(draftAfterObservationSubmitError(draft), draft);
  });
});

describe("resolveObservationSubmitError", () => {
  it("exposes the error message", () => {
    assert.equal(
      resolveObservationSubmitError(new Error("Acesso negado.")),
      "Acesso negado.",
    );
  });

  it("falls back when the failure has no message", () => {
    assert.equal(
      resolveObservationSubmitError(new Error("   ")),
      "Não foi possível enviar a observação",
    );
    assert.equal(
      resolveObservationSubmitError(null),
      "Não foi possível enviar a observação",
    );
  });
});

describe("resolveObservationEditError", () => {
  it("exposes the error message and falls back when empty", () => {
    assert.equal(resolveObservationEditError(new Error("Proibido.")), "Proibido.");
    assert.equal(resolveObservationEditError(null), "Não foi possível editar a observação");
  });
});

describe("replaceObservation", () => {
  it("swaps the item with the same id keeping order and cursor", () => {
    const edited = { ...observation("obs-2", "novo"), editedAt: "2026-09-27T13:00:00.000Z" };
    const next = replaceObservation(
      { items: [observation("obs-1"), observation("obs-2")], hasOlder: true, nextBefore: CURSOR },
      edited,
    );

    assert.deepEqual(
      next?.items.map((item) => item.body),
      ["texto", "novo"],
    );
    assert.equal(next?.items[1], edited);
    assert.equal(next?.hasOlder, true);
    assert.deepEqual(next?.nextBefore, CURSOR);
  });

  it("keeps a missing page missing", () => {
    assert.equal(replaceObservation(undefined, observation("obs-1")), undefined);
  });
});

describe("canSaveObservationEdit", () => {
  it("requires a valid body different from the original", () => {
    assert.equal(canSaveObservationEdit("novo", "antigo", false), true);
    assert.equal(canSaveObservationEdit(" antigo ", "antigo", false), false);
    assert.equal(canSaveObservationEdit("   ", "antigo", false), false);
    assert.equal(canSaveObservationEdit("a".repeat(2001), "antigo", false), false);
  });

  it("blocks while saving", () => {
    assert.equal(canSaveObservationEdit("novo", "antigo", true), false);
  });
});

describe("isObservationListLoading", () => {
  it("stays idle while the modal is closed", () => {
    assert.equal(
      isObservationListLoading({
        open: false,
        hasData: true,
        isError: false,
        isQueryLoading: true,
      }),
      false,
    );
  });

  it("is loading on open until a page or an error arrives", () => {
    assert.equal(
      isObservationListLoading({
        open: true,
        hasData: false,
        isError: false,
        isQueryLoading: false,
      }),
      true,
    );
    assert.equal(
      isObservationListLoading({
        open: true,
        hasData: false,
        isError: false,
        isQueryLoading: true,
      }),
      true,
    );
  });

  it("stops loading when the page or the error is known", () => {
    assert.equal(
      isObservationListLoading({
        open: true,
        hasData: true,
        isError: false,
        isQueryLoading: false,
      }),
      false,
    );
    assert.equal(
      isObservationListLoading({
        open: true,
        hasData: false,
        isError: true,
        isQueryLoading: false,
      }),
      false,
    );
  });
});
