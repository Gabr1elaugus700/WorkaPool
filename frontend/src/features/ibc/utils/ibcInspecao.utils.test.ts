import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { IbcChecklistDTO, IbcChecklistItemNoChecklistDTO } from "../types/ibcChecklist.types";
import type { IbcInspecaoRespostaDTO } from "../types/ibcInspecao.types";
import {
  buildInspecaoPayload,
  checklistInspecaoExigeMinimas,
  checklistInspecaoSemMinimasConfiguradas,
  countItensInspecaoPreenchidos,
  formatAlocacaoAlerta,
  formatItemReprovacaoInspecao,
  formatItensAbaixoDoMinimo,
  formatLimitesInspecaoHistorico,
  formatMediaVsMinima,
  formatNotaInspecao,
  formatRespostaInspecaoHistorico,
  isRespostaNumericaAbaixoDoMinimo,
  itemRascunhoCompleto,
  listItensInspecao,
  notaMinimaDoItem,
  parseNotaInspecao,
  podeInspecionarIbc,
  simNaoBloqueanteForaDoEsperado,
} from "./ibcInspecao.utils";

function itemNumeric(
  itemId: string,
  ordem: number,
  critico = false,
  ativo = true,
): IbcChecklistItemNoChecklistDTO {
  return {
    itemId,
    descricao: `Item ${itemId}`,
    tipo: "NUMERICO",
    critico,
    respostaEsperada: null,
    bloqueante: null,
    ativo,
    ordem,
  };
}

function itemSimNao(
  itemId: string,
  ordem: number,
  respostaEsperada: "SIM" | "NAO" = "SIM",
  bloqueante = true,
  ativo = true,
): IbcChecklistItemNoChecklistDTO {
  return {
    itemId,
    descricao: `Item ${itemId}`,
    tipo: "SIM_NAO",
    critico: false,
    respostaEsperada,
    bloqueante,
    ativo,
    ordem,
  };
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
    const itens = listItensInspecao(checklist([itemNumeric("c", 3), itemNumeric("a", 1), itemNumeric("b", 2, false, false)]));
    assert.deepEqual(
      itens.map((i) => i.itemId),
      ["a", "c"],
    );
  });
});

describe("checklistInspecaoExigeMinimas", () => {
  it("is true when any active item is numeric", () => {
    const itens = listItensInspecao(checklist([itemSimNao("s", 1), itemNumeric("n", 2)]));
    assert.equal(checklistInspecaoExigeMinimas(itens), true);
    assert.equal(checklistInspecaoSemMinimasConfiguradas({ notaMinimaCritico: null, mediaMinima: 7 }, itens), true);
  });

  it("is false for sim/não-only selection", () => {
    const itens = listItensInspecao(checklist([itemSimNao("s", 1)]));
    assert.equal(checklistInspecaoExigeMinimas(itens), false);
  });
});

describe("itemRascunhoCompleto / buildInspecaoPayload", () => {
  const itens = listItensInspecao(checklist([itemNumeric("b", 2), itemNumeric("a", 1), itemNumeric("x", 3, false, false)]));

  it("builds numeric respostas in checklist order", () => {
    assert.deepEqual(buildInspecaoPayload("chk", itens, { b: { nota: "9" }, a: { nota: "0" } }, "  ok  "), {
      checklistModeloId: "chk",
      respostas: [
        { checklistItemId: "a", nota: 0 },
        { checklistItemId: "b", nota: 9 },
      ],
      observacao: "ok",
    });
  });

  it("builds sim/não with optional item observacao", () => {
    const simItens = listItensInspecao(checklist([itemSimNao("s", 1)]));
    assert.deepEqual(
      buildInspecaoPayload("chk", simItens, { s: { resposta: "NAO", observacaoItem: " detalhe " } }, ""),
      {
        checklistModeloId: "chk",
        respostas: [{ checklistItemId: "s", resposta: "NAO", observacao: "detalhe" }],
      },
    );
  });

  it("returns null until every active item is complete", () => {
    assert.equal(buildInspecaoPayload("chk", itens, { a: { nota: "8" } }, ""), null);
    assert.equal(countItensInspecaoPreenchidos(itens, { a: { nota: "8" } }), 1);
    assert.equal(itemRascunhoCompleto(itemSimNao("s", 1), {}), false);
    assert.equal(itemRascunhoCompleto(itemSimNao("s", 1), { resposta: "SIM" }), true);
  });

  it("rejects item observacao over the limit", () => {
    const simItens = listItensInspecao(checklist([itemSimNao("s", 1)]));
    assert.equal(
      buildInspecaoPayload("chk", simItens, { s: { resposta: "SIM", observacaoItem: "x".repeat(501) } }, ""),
      null,
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
    assert.equal(parseNotaInspecao("11"), null);
  });
});

describe("formatNotaInspecao", () => {
  it("formats in pt-BR with up to two decimals", () => {
    assert.equal(formatNotaInspecao(8), "8");
    assert.equal(formatNotaInspecao(7.5), "7,5");
  });

  it("returns a dash for null", () => {
    assert.equal(formatNotaInspecao(null), "—");
  });
});

describe("isRespostaNumericaAbaixoDoMinimo", () => {
  const limites = { notaMinimaCritico: 8, mediaMinima: 6.5 };

  it("compares critical items with notaMinimaCritico and the others with mediaMinima", () => {
    assert.equal(notaMinimaDoItem({ tipo: "NUMERICO", critico: true }, limites), 8);
    assert.equal(notaMinimaDoItem({ tipo: "SIM_NAO", critico: false }, limites), null);
  });

  it("flags only numeric scores strictly below the minimum", () => {
    assert.equal(isRespostaNumericaAbaixoDoMinimo({ tipo: "NUMERICO", critico: true, nota: 7 }, limites), true);
    assert.equal(isRespostaNumericaAbaixoDoMinimo({ tipo: "NUMERICO", critico: true, nota: 8 }, limites), false);
    assert.equal(isRespostaNumericaAbaixoDoMinimo({ tipo: "SIM_NAO", critico: false, nota: null }, limites), false);
  });
});

describe("simNaoBloqueanteForaDoEsperado", () => {
  const base: IbcInspecaoRespostaDTO = {
    checklistItemId: "1",
    descricao: "Lacre",
    tipo: "SIM_NAO",
    critico: false,
    nota: null,
    resposta: "NAO",
    respostaEsperada: "SIM",
    bloqueante: true,
    observacao: null,
  };

  it("is true for bloqueante outside expected", () => {
    assert.equal(simNaoBloqueanteForaDoEsperado(base), true);
    assert.equal(simNaoBloqueanteForaDoEsperado({ ...base, bloqueante: false }), false);
  });
});

describe("formatMediaVsMinima / formatLimitesInspecaoHistorico", () => {
  it("shows the obtained average against the minimum", () => {
    assert.equal(formatMediaVsMinima(6.5, 7), "média 6,5 · mín. 7");
  });

  it("omits media minimum when null", () => {
    assert.equal(formatMediaVsMinima(6.5, null), "média 6,5");
    assert.equal(formatLimitesInspecaoHistorico({ notaMinimaCritico: null, mediaMinima: null }), "Avaliação por sim/não bloqueante");
  });
});

describe("formatRespostaInspecaoHistorico", () => {
  it("shows numeric nota or sim/não snapshot", () => {
    assert.equal(
      formatRespostaInspecaoHistorico({
        checklistItemId: "n",
        descricao: "Válvula",
        tipo: "NUMERICO",
        critico: true,
        nota: 9,
        resposta: null,
        respostaEsperada: null,
        bloqueante: null,
        observacao: null,
      }),
      "9",
    );
    assert.match(
      formatRespostaInspecaoHistorico({
        checklistItemId: "s",
        descricao: "Lacre",
        tipo: "SIM_NAO",
        critico: false,
        nota: null,
        resposta: "NAO",
        respostaEsperada: "SIM",
        bloqueante: true,
        observacao: null,
      }),
      /Não.*esperado Sim.*bloqueante: Sim/,
    );
  });
});

describe("formatItensAbaixoDoMinimo", () => {
  it("lists numeric and sim/não reprovação items", () => {
    assert.equal(
      formatItensAbaixoDoMinimo([
        { descricao: "Válvula", nota: 3, notaMinima: 6 },
        { descricao: "Lacre", tipo: "SIM_NAO", resposta: "NAO", respostaEsperada: "SIM" },
      ]),
      "Válvula: 3 (mín. 6) · Lacre: Não (esperado Sim)",
    );
    assert.equal(formatItemReprovacaoInspecao({ descricao: "X", tipo: "SIM_NAO", resposta: "NAO", respostaEsperada: "SIM" }), "X: Não (esperado Sim)");
  });
});

describe("podeInspecionarIbc", () => {
  it("allows an IBC in the yard that was not replaced", () => {
    assert.equal(podeInspecionarIbc({ custodia: "PATIO", convertedToContainerId: null }), true);
  });

  it("blocks an IBC in transit or already replaced", () => {
    assert.equal(podeInspecionarIbc({ custodia: "EM_VIAGEM", convertedToContainerId: null }), false);
    assert.equal(podeInspecionarIbc({ custodia: "PATIO", convertedToContainerId: "ibc-novo" }), false);
  });
});

describe("formatAlocacaoAlerta", () => {
  it("names the carga and pedido of the open allocation", () => {
    assert.equal(formatAlocacaoAlerta({ codCar: 123, numPed: "456" }), "Alocado na carga 123 · pedido 456");
  });
});