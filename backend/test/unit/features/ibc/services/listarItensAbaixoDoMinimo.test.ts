import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { listarItensAbaixoDoMinimo } from "../../../../../src/features/ibc/services/listarItensAbaixoDoMinimo";

const limites = { notaMinimaCritico: 7, mediaMinima: 6 };

describe("listarItensAbaixoDoMinimo", () => {
  it("lista crítico abaixo de notaMinimaCritico e não crítico abaixo de mediaMinima, cada um com seu mínimo", () => {
    const result = listarItensAbaixoDoMinimo({
      ...limites,
      respostas: [
        {
          descricao: "Válvula",
          tipo: "NUMERICO",
          critico: true,
          nota: 6,
          resposta: null,
          respostaEsperada: null,
          bloqueante: null,
        },
        {
          descricao: "Tampa",
          tipo: "NUMERICO",
          critico: false,
          nota: 5,
          resposta: null,
          respostaEsperada: null,
          bloqueante: null,
        },
        {
          descricao: "Grade",
          tipo: "NUMERICO",
          critico: false,
          nota: 9,
          resposta: null,
          respostaEsperada: null,
          bloqueante: null,
        },
      ],
    });

    assert.deepEqual(result, [
      { descricao: "Válvula", nota: 6, notaMinima: 7 },
      { descricao: "Tampa", nota: 5, notaMinima: 6 },
    ]);
  });

  it("não lista item no limite exato", () => {
    const result = listarItensAbaixoDoMinimo({
      ...limites,
      respostas: [
        {
          descricao: "Válvula",
          tipo: "NUMERICO",
          critico: true,
          nota: 7,
          resposta: null,
          respostaEsperada: null,
          bloqueante: null,
        },
        {
          descricao: "Tampa",
          tipo: "NUMERICO",
          critico: false,
          nota: 6,
          resposta: null,
          respostaEsperada: null,
          bloqueante: null,
        },
      ],
    });

    assert.deepEqual(result, []);
  });

  it("lista sim/não bloqueante fora do esperado", () => {
    const result = listarItensAbaixoDoMinimo({
      notaMinimaCritico: null,
      mediaMinima: null,
      respostas: [
        {
          descricao: "Lacre",
          tipo: "SIM_NAO",
          critico: false,
          nota: null,
          resposta: "NAO",
          respostaEsperada: "SIM",
          bloqueante: true,
        },
      ],
    });

    assert.deepEqual(result, [
      {
        descricao: "Lacre",
        tipo: "SIM_NAO",
        resposta: "NAO",
        respostaEsperada: "SIM",
      },
    ]);
  });
});
