import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { IbcChecklistItemDTO } from "../types/ibcChecklist.types";
import {
  applyItemFormTipoChange,
  buildItemPayload,
  canSubmitItemForm,
  initialItemFormState,
} from "./ibcChecklistItemForm.utils";

const itemNumerico: IbcChecklistItemDTO = {
  id: "1",
  descricao: "Tampa",
  tipo: "NUMERICO",
  critico: true,
  respostaEsperada: null,
  bloqueante: null,
  ativo: true,
};

const itemSimNao: IbcChecklistItemDTO = {
  id: "2",
  descricao: "Lacre",
  tipo: "SIM_NAO",
  critico: false,
  respostaEsperada: "SIM",
  bloqueante: true,
  ativo: true,
};

describe("ibcChecklistItemForm.utils", () => {
  it("inicializa item novo como numérico sem crítico", () => {
    const state = initialItemFormState(null);
    assert.equal(state.tipo, "NUMERICO");
    assert.equal(state.critico, false);
    assert.equal(state.respostaEsperada, undefined);
    assert.equal(state.bloqueante, undefined);
  });

  it("preenche edição só com campos do tipo atual", () => {
    const numerico = initialItemFormState(itemNumerico);
    assert.equal(numerico.critico, true);
    assert.equal(numerico.respostaEsperada, undefined);

    const simNao = initialItemFormState(itemSimNao);
    assert.equal(simNao.respostaEsperada, "SIM");
    assert.equal(simNao.bloqueante, true);
    assert.equal(simNao.critico, false);
  });

  it("limpa campos do outro tipo ao trocar tipo", () => {
    const fromSim = applyItemFormTipoChange(
      initialItemFormState(itemSimNao),
      "NUMERICO",
    );
    assert.equal(fromSim.tipo, "NUMERICO");
    assert.equal(fromSim.critico, false);
    assert.equal(fromSim.respostaEsperada, undefined);

    const fromNum = applyItemFormTipoChange(initialItemFormState(itemNumerico), "SIM_NAO");
    assert.equal(fromNum.tipo, "SIM_NAO");
    assert.equal(fromNum.respostaEsperada, undefined);
    assert.equal(fromNum.bloqueante, undefined);
  });

  it("só libera envio em sim/não com resposta esperada e bloqueante", () => {
    assert.equal(canSubmitItemForm({ ...initialItemFormState(null), descricao: "X" }), true);
    const incompleto = applyItemFormTipoChange(
      { ...initialItemFormState(null), descricao: "X" },
      "SIM_NAO",
    );
    assert.equal(canSubmitItemForm(incompleto), false);
    assert.equal(
      canSubmitItemForm({ ...incompleto, respostaEsperada: "SIM", bloqueante: true }),
      true,
    );
  });

  it("monta payload numérico e sim/não", () => {
    const novoNum = buildItemPayload(
      { descricao: "A", tipo: "NUMERICO", critico: true },
      { isEdit: false },
    );
    assert.deepEqual(novoNum, { descricao: "A", critico: true });

    const novoSim = buildItemPayload(
      {
        descricao: "B",
        tipo: "SIM_NAO",
        critico: false,
        respostaEsperada: "NAO",
        bloqueante: false,
      },
      { isEdit: false },
    );
    assert.deepEqual(novoSim, {
      descricao: "B",
      tipo: "SIM_NAO",
      respostaEsperada: "NAO",
      bloqueante: false,
    });

    const trocaParaSim = buildItemPayload(
      {
        descricao: "Tampa",
        tipo: "SIM_NAO",
        critico: false,
        respostaEsperada: "SIM",
        bloqueante: true,
      },
      { isEdit: true, originalTipo: "NUMERICO" },
    );
    assert.equal(trocaParaSim.tipo, "SIM_NAO");
    assert.equal("critico" in trocaParaSim, false);

    const trocaParaNum = buildItemPayload(
      { descricao: "Lacre", tipo: "NUMERICO", critico: false },
      { isEdit: true, originalTipo: "SIM_NAO" },
    );
    assert.deepEqual(trocaParaNum, { descricao: "Lacre", critico: false, tipo: "NUMERICO" });
  });
});