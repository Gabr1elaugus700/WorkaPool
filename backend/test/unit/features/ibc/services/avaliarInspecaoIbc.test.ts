import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { avaliarInspecaoIbc } from "../../../../../src/features/ibc/services/avaliarInspecaoIbc";

const limites = { notaMinimaCritico: 7, mediaMinima: 6 };

function numerico(
  nota: number,
  critico: boolean,
): { tipo: "NUMERICO"; nota: number; critico: boolean; resposta: null; respostaEsperada: null; bloqueante: null } {
  return {
    tipo: "NUMERICO",
    nota,
    critico,
    resposta: null,
    respostaEsperada: null,
    bloqueante: null,
  };
}

function simNao(
  resposta: "SIM" | "NAO",
  respostaEsperada: "SIM" | "NAO",
  bloqueante: boolean,
): {
  tipo: "SIM_NAO";
  nota: null;
  critico: false;
  resposta: "SIM" | "NAO";
  respostaEsperada: "SIM" | "NAO";
  bloqueante: boolean;
} {
  return {
    tipo: "SIM_NAO",
    nota: null,
    critico: false,
    resposta,
    respostaEsperada,
    bloqueante,
  };
}

describe("avaliarInspecaoIbc", () => {
  it("reprova quando um item crítico fica abaixo da nota mínima", () => {
    const result = avaliarInspecaoIbc({
      ...limites,
      respostas: [numerico(6, true), numerico(10, false), numerico(10, false)],
    });

    assert.deepEqual(result, { resultado: "REPROVADA", mediaObtida: 10 });
  });

  it("reprova quando a média dos não críticos fica abaixo da média mínima", () => {
    const result = avaliarInspecaoIbc({
      ...limites,
      respostas: [numerico(10, true), numerico(5, false), numerico(6, false)],
    });

    assert.deepEqual(result, { resultado: "REPROVADA", mediaObtida: 5.5 });
  });

  it("aprova só pela regra do crítico quando não há itens não críticos", () => {
    const result = avaliarInspecaoIbc({
      ...limites,
      respostas: [numerico(7, true), numerico(9, true)],
    });

    assert.deepEqual(result, { resultado: "APROVADA", mediaObtida: null });
  });

  it("aprova no limite exato (crítico = mínimo, média = mínima)", () => {
    const result = avaliarInspecaoIbc({
      ...limites,
      respostas: [numerico(7, true), numerico(5, false), numerico(7, false)],
    });

    assert.deepEqual(result, { resultado: "APROVADA", mediaObtida: 6 });
  });

  it("reprova quando sim/não bloqueante difere da resposta esperada", () => {
    const result = avaliarInspecaoIbc({
      notaMinimaCritico: null,
      mediaMinima: null,
      respostas: [simNao("NAO", "SIM", true)],
    });

    assert.deepEqual(result, { resultado: "REPROVADA", mediaObtida: null });
  });

  it("aprova quando sim/não não bloqueante difere da resposta esperada", () => {
    const result = avaliarInspecaoIbc({
      notaMinimaCritico: null,
      mediaMinima: null,
      respostas: [simNao("NAO", "SIM", false)],
    });

    assert.deepEqual(result, { resultado: "APROVADA", mediaObtida: null });
  });

  it("ignora sim/não no cálculo da média numérica", () => {
    const result = avaliarInspecaoIbc({
      ...limites,
      respostas: [
        numerico(8, true),
        numerico(9, false),
        simNao("SIM", "SIM", true),
      ],
    });

    assert.deepEqual(result, { resultado: "APROVADA", mediaObtida: 9 });
  });

  it("reprova checklist misto com sim/não bloqueante fora do esperado mesmo com notas ok", () => {
    const result = avaliarInspecaoIbc({
      ...limites,
      respostas: [
        numerico(8, true),
        numerico(9, false),
        simNao("NAO", "SIM", true),
      ],
    });

    assert.deepEqual(result, { resultado: "REPROVADA", mediaObtida: 9 });
  });

  it("aprova checklist só sim/não sem mínimos", () => {
    const result = avaliarInspecaoIbc({
      notaMinimaCritico: null,
      mediaMinima: null,
      respostas: [
        simNao("SIM", "SIM", true),
        simNao("NAO", "NAO", false),
      ],
    });

    assert.deepEqual(result, { resultado: "APROVADA", mediaObtida: null });
  });
});