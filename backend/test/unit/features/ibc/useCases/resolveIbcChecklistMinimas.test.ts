import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { AppError } from "../../../../../src/utils/AppError";
import {
  checklistTemItemNumerico,
  resolveIbcChecklistMinimas,
} from "../../../../../src/features/ibc/useCases/resolveIbcChecklistMinimas";

describe("checklistTemItemNumerico", () => {
  it("is true when any linked item is NUMERICO", () => {
    assert.equal(checklistTemItemNumerico([{ tipo: "SIM_NAO" }, { tipo: "NUMERICO" }]), true);
  });

  it("is false when every item is SIM_NAO", () => {
    assert.equal(checklistTemItemNumerico([{ tipo: "SIM_NAO" }]), false);
  });
});

describe("resolveIbcChecklistMinimas", () => {
  it("returns null minima for sim/não-only lists", () => {
    assert.deepEqual(
      resolveIbcChecklistMinimas({
        itens: [{ tipo: "SIM_NAO" }],
        incoming: { notaMinimaCritico: 7, mediaMinima: 6 },
      }),
      { notaMinimaCritico: null, mediaMinima: null },
    );
  });

  it("requires both minima on create with numeric items", () => {
    assert.throws(
      () =>
        resolveIbcChecklistMinimas({
          itens: [{ tipo: "NUMERICO" }],
          incoming: {},
        }),
      (error: unknown) => error instanceof AppError && error.code === "IBC_CHECKLIST_INVALID_BODY",
    );
  });

  it("accepts incoming minima for numeric checklists", () => {
    assert.deepEqual(
      resolveIbcChecklistMinimas({
        itens: [{ tipo: "NUMERICO" }],
        incoming: { notaMinimaCritico: 8, mediaMinima: 7 },
      }),
      { notaMinimaCritico: 8, mediaMinima: 7 },
    );
  });

  it("falls back to existing on update when minima omitted", () => {
    assert.deepEqual(
      resolveIbcChecklistMinimas({
        itens: [{ tipo: "NUMERICO" }],
        incoming: {},
        existing: { notaMinimaCritico: 7, mediaMinima: 6 },
      }),
      { notaMinimaCritico: 7, mediaMinima: 6 },
    );
  });

  it("rejects explicit null minima when numeric items remain", () => {
    assert.throws(
      () =>
        resolveIbcChecklistMinimas({
          itens: [{ tipo: "NUMERICO" }],
          incoming: { notaMinimaCritico: null, mediaMinima: 6 },
        }),
      (error: unknown) => error instanceof AppError && error.statusCode === 400,
    );
  });
});