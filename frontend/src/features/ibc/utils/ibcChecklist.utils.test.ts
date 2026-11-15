import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildChecklistPayload,
  checklistTemItemNumerico,
  listChecklistsDisponiveisParaVinculo,
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
    {
      id: "1",
      descricao: "Tampa",
      tipo: "NUMERICO" as const,
      critico: true,
      respostaEsperada: null,
      bloqueante: null,
      ativo: true,
    },
    {
      id: "2",
      descricao: "Válvula",
      tipo: "NUMERICO" as const,
      critico: false,
      respostaEsperada: null,
      bloqueante: null,
      ativo: false,
    },
    {
      id: "3",
      descricao: "Gaiola",
      tipo: "NUMERICO" as const,
      critico: false,
      respostaEsperada: null,
      bloqueante: null,
      ativo: true,
    },
  ];

  it("lists only active items not yet in the checklist", () => {
    assert.deepEqual(
      listItensDisponiveis(itens, ["3"]).map((item) => item.id),
      ["1"],
    );
  });
});

describe("listChecklistsDisponiveisParaVinculo", () => {
  const checklist = (id: string, nome: string, ativo = true) => ({
    id,
    nome,
    ativo,
    notaMinimaCritico: 8,
    mediaMinima: 7,
    createdAt: "2026-10-01T00:00:00.000Z",
    totalItens: 3,
  });
  const vinculo = (checklistModeloId: string) => ({
    checklistModeloId,
    nome: "Vinculado",
    ativo: true,
    vinculadoEm: "2026-10-02T00:00:00.000Z",
    vinculadoPor: { id: "u1", nome: "Ana" },
  });

  it("leaves out inactive and already linked checklists", () => {
    const checklists = [
      checklist("a", "Soda"),
      checklist("b", "Estrutural", false),
      checklist("c", "Ácido"),
    ];
    assert.deepEqual(
      listChecklistsDisponiveisParaVinculo(checklists, [vinculo("c")]).map((c) => c.id),
      ["a"],
    );
  });

  it("sorts by name in pt-BR", () => {
    const checklists = [checklist("a", "Soda"), checklist("b", "Ácido"), checklist("c", "Estrutural")];
    assert.deepEqual(
      listChecklistsDisponiveisParaVinculo(checklists, []).map((c) => c.nome),
      ["Ácido", "Estrutural", "Soda"],
    );
  });

  it("returns an empty list when there is nothing to link", () => {
    assert.deepEqual(listChecklistsDisponiveisParaVinculo([], [vinculo("a")]), []);
    assert.deepEqual(
      listChecklistsDisponiveisParaVinculo([checklist("a", "Soda")], [vinculo("a")]),
      [],
    );
  });
});

const catalogo = [
  {
    id: "a",
    descricao: "Tampa",
    tipo: "NUMERICO" as const,
    critico: true,
    respostaEsperada: null,
    bloqueante: null,
    ativo: true,
  },
  {
    id: "b",
    descricao: "Base",
    tipo: "NUMERICO" as const,
    critico: false,
    respostaEsperada: null,
    bloqueante: null,
    ativo: true,
  },
  {
    id: "s",
    descricao: "Lacre",
    tipo: "SIM_NAO" as const,
    critico: false,
    respostaEsperada: "SIM" as const,
    bloqueante: true,
    ativo: true,
  },
];

describe("checklistTemItemNumerico", () => {
  it("is true when any selected item is numeric", () => {
    assert.equal(checklistTemItemNumerico(catalogo, ["s", "b"]), true);
  });

  it("is false for sim/não-only selection", () => {
    assert.equal(checklistTemItemNumerico(catalogo, ["s"]), false);
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
    assert.deepEqual(buildChecklistPayload(form, catalogo), {
      nome: "Checklist Soda",
      notaMinimaCritico: 8,
      mediaMinima: 7.5,
      itensIds: ["b", "a"],
    });
  });

  it("returns null minima for sim/não-only checklists", () => {
    assert.deepEqual(
      buildChecklistPayload(
        { nome: "Lacre", notaMinimaCritico: "", mediaMinima: "", itensIds: ["s"] },
        catalogo,
      ),
      { nome: "Lacre", notaMinimaCritico: null, mediaMinima: null, itensIds: ["s"] },
    );
  });

  it("returns null when name, grades or items are missing", () => {
    assert.equal(buildChecklistPayload({ ...form, nome: "  " }, catalogo), null);
    assert.equal(buildChecklistPayload({ ...form, mediaMinima: "11" }, catalogo), null);
    assert.equal(buildChecklistPayload({ ...form, notaMinimaCritico: "" }, catalogo), null);
    assert.equal(buildChecklistPayload({ ...form, itensIds: [] }, catalogo), null);
  });
});
