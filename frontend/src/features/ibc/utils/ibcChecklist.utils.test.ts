import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildChecklistPayload,
  listItensDisponiveis,
  moveItem,
  parseNotaMinima,
} from "./ibcChecklist.utils";

describe("parseNotaMinima", () => {
  it("accepts integers and decimals with comma or dot", () => {
    assert.equal(parseNotaMinima("7"), 7);
    assert.equal(parseNotaMinima(" 7,5 "), 7.5);
    assert.equal(parseNotaMinima("8.25"), 8.25);
  });

  it("accepts the 0 and 10 boundaries", () => {
    assert.equal(parseNotaMinima("0"), 0);
    assert.equal(parseNotaMinima("10"), 10);
  });

  it("rejects out of range, blank and non numeric values", () => {
    assert.equal(parseNotaMinima("10,1"), null);
    assert.equal(parseNotaMinima("-1"), null);
    assert.equal(parseNotaMinima(""), null);
    assert.equal(parseNotaMinima("abc"), null);
  });
});

describe("moveItem", () => {
  it("moves an item up and down", () => {
    assert.deepEqual(moveItem(["a", "b", "c"], 1, "up"), ["b", "a", "c"]);
    assert.deepEqual(moveItem(["a", "b", "c"], 1, "down"), ["a", "c", "b"]);
  });

  it("keeps the list when moving past the edges", () => {
    const ids = ["a", "b"];
    assert.equal(moveItem(ids, 0, "up"), ids);
    assert.equal(moveItem(ids, 1, "down"), ids);
    assert.equal(moveItem(ids, 5, "up"), ids);
  });

  it("does not mutate the input", () => {
    const ids = ["a", "b"];
    moveItem(ids, 0, "down");
    assert.deepEqual(ids, ["a", "b"]);
  });
});

describe("listItensDisponiveis", () => {
  const itens = [
    { id: "1", descricao: "Tampa", critico: true, ativo: true },
    { id: "2", descricao: "Válvula", critico: false, ativo: false },
    { id: "3", descricao: "Gaiola", critico: false, ativo: true },
  ];

  it("lists only active items not yet in the checklist", () => {
    assert.deepEqual(
      listItensDisponiveis(itens, ["3"]).map((item) => item.id),
      ["1"],
    );
  });
});

describe("buildChecklistPayload", () => {
  const form = {
    nome: "  Checklist Soda ",
    notaMinimaCritico: "8",
    mediaMinima: "7,5",
    itensIds: ["b", "a"],
  };

  it("trims the name, parses the grades and keeps item order", () => {
    assert.deepEqual(buildChecklistPayload(form), {
      nome: "Checklist Soda",
      notaMinimaCritico: 8,
      mediaMinima: 7.5,
      itensIds: ["b", "a"],
    });
  });

  it("returns null when name, grades or items are missing", () => {
    assert.equal(buildChecklistPayload({ ...form, nome: "  " }), null);
    assert.equal(buildChecklistPayload({ ...form, mediaMinima: "11" }), null);
    assert.equal(buildChecklistPayload({ ...form, notaMinimaCritico: "" }), null);
    assert.equal(buildChecklistPayload({ ...form, itensIds: [] }), null);
  });
});
