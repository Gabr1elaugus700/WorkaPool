import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { IbcChecklistDTO, IbcChecklistItemNoChecklistDTO } from "../types/ibcChecklist.types";
import {
  buildInspecaoPayload,
  formatNotaInspecao,
  listItensInspecao,
  parseNotaInspecao,
} from "./ibcInspecao.utils";

function item(itemId: string, ordem: number, ativo = true): IbcChecklistItemNoChecklistDTO {
  return { itemId, descricao: `Item ${itemId}`, critico: false, ativo, ordem };
}

function checklist(itens: IbcChecklistItemNoChecklistDTO[]): IbcChecklistDTO {
  return {
    id: "chk",
    nome: "Checklist Soda",
    notaMinimaCritico: 8,
    mediaMinima: 7,
    ativo: true,
    createdAt: "2026-10-01T00:00:00.000Z",
    itens,
  };
}

describe("listItensInspecao", () => {
  it("returns only active items sorted by ordem", () => {
    const itens = listItensInspecao(checklist([item("c", 3), item("a", 1), item("b", 2, false)]));
    assert.deepEqual(
      itens.map((i) => i.itemId),
      ["a", "c"],
    );
  });
});

describe("parseNotaInspecao", () => {
  it("accepts integers from 0 to 10", () => {
    assert.equal(parseNotaInspecao("0"), 0);
    assert.equal(parseNotaInspecao(" 7 "), 7);
    assert.equal(parseNotaInspecao("10"), 10);
  });

  it("rejects blank, decimal, negative and out of range values", () => {
    assert.equal(parseNotaInspecao(""), null);
    assert.equal(parseNotaInspecao("7,5"), null);
    assert.equal(parseNotaInspecao("7.5"), null);
    assert.equal(parseNotaInspecao("-1"), null);
    assert.equal(parseNotaInspecao("11"), null);
    assert.equal(parseNotaInspecao("abc"), null);
  });
});

describe("buildInspecaoPayload", () => {
  const itens = listItensInspecao(checklist([item("b", 2), item("a", 1), item("x", 3, false)]));

  it("builds respostas in checklist order when every active item has a score", () => {
    assert.deepEqual(buildInspecaoPayload("chk", itens, { b: "9", a: "0" }, "  ok  "), {
      checklistModeloId: "chk",
      respostas: [
        { checklistItemId: "a", nota: 0 },
        { checklistItemId: "b", nota: 9 },
      ],
      observacao: "ok",
    });
  });

  it("ignores scores of inactive items and omits a blank observacao", () => {
    assert.deepEqual(buildInspecaoPayload("chk", itens, { a: "10", b: "5", x: "3" }, "  "), {
      checklistModeloId: "chk",
      respostas: [
        { checklistItemId: "a", nota: 10 },
        { checklistItemId: "b", nota: 5 },
      ],
    });
  });

  it("returns null while any active item is missing or invalid", () => {
    assert.equal(buildInspecaoPayload("chk", itens, { a: "8" }, ""), null);
    assert.equal(buildInspecaoPayload("chk", itens, { a: "8", b: "11" }, ""), null);
  });

  it("returns null for an empty checklist or an observacao over the limit", () => {
    assert.equal(buildInspecaoPayload("chk", [], {}, ""), null);
    assert.equal(buildInspecaoPayload("chk", itens, { a: "8", b: "8" }, "x".repeat(501)), null);
  });
});

describe("formatNotaInspecao", () => {
  it("formats in pt-BR with up to two decimals", () => {
    assert.equal(formatNotaInspecao(8), "8");
    assert.equal(formatNotaInspecao(7.5), "7,5");
    assert.equal(formatNotaInspecao(6.666), "6,67");
  });

  it("returns a dash for null", () => {
    assert.equal(formatNotaInspecao(null), "—");
  });
});
