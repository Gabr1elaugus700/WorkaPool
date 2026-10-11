import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { listarItensAbaixoDoMinimo } from "../../../../../src/features/ibc/services/listarItensAbaixoDoMinimo";

const limites = { notaMinimaCritico: 7, mediaMinima: 6 };

describe("listarItensAbaixoDoMinimo", () => {
  it("lista crítico abaixo de notaMinimaCritico e não crítico abaixo de mediaMinima, cada um com seu mínimo", () => {
    const result = listarItensAbaixoDoMinimo({
      ...limites,
      respostas: [
        { descricao: "Válvula", critico: true, nota: 6 },
        { descricao: "Tampa", critico: false, nota: 5 },
        { descricao: "Grade", critico: false, nota: 9 },
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
        { descricao: "Válvula", critico: true, nota: 7 },
        { descricao: "Tampa", critico: false, nota: 6 },
      ],
    });

    assert.deepEqual(result, []);
  });
});
