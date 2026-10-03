import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { normalizeIbcProdutoAbreviacao } from "../../../../../src/features/ibc/services/normalizeIbcProdutoAbreviacao";
import { AppError } from "../../../../../src/utils/AppError";

describe("normalizeIbcProdutoAbreviacao", () => {
  it("normalizes to uppercase and trims", () => {
    assert.equal(normalizeIbcProdutoAbreviacao(" s "), "S");
    assert.equal(normalizeIbcProdutoAbreviacao("so"), "SO");
  });

  it("rejects non alphabetic chars", () => {
    assert.throws(
      () => normalizeIbcProdutoAbreviacao("S1"),
      (error: unknown) =>
        error instanceof AppError &&
        error.code === "IBC_PRODUTO_ABREVIACAO_INVALIDA",
    );
  });

  it("rejects length outside 1..2", () => {
    for (const value of ["", "ABC"]) {
      assert.throws(
        () => normalizeIbcProdutoAbreviacao(value),
        (error: unknown) =>
          error instanceof AppError &&
          error.code === "IBC_PRODUTO_ABREVIACAO_INVALIDA",
      );
    }
  });
});
