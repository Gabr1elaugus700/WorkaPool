import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { avaliarInspecaoIbc } from "../../../../../src/features/ibc/services/avaliarInspecaoIbc";

const limites = { notaMinimaCritico: 7, mediaMinima: 6 };

describe("avaliarInspecaoIbc", () => {
  it("reprova quando um item crítico fica abaixo da nota mínima", () => {
    const result = avaliarInspecaoIbc({
      ...limites,
      respostas: [
        { nota: 6, critico: true },
        { nota: 10, critico: false },
        { nota: 10, critico: false },
      ],
    });

    assert.deepEqual(result, { resultado: "REPROVADA", mediaObtida: 10 });
  });

  it("reprova quando a média dos não críticos fica abaixo da média mínima", () => {
    const result = avaliarInspecaoIbc({
      ...limites,
      respostas: [
        { nota: 10, critico: true },
        { nota: 5, critico: false },
        { nota: 6, critico: false },
      ],
    });

    assert.deepEqual(result, { resultado: "REPROVADA", mediaObtida: 5.5 });
  });

  it("aprova só pela regra do crítico quando não há itens não críticos", () => {
    const result = avaliarInspecaoIbc({
      ...limites,
      respostas: [
        { nota: 7, critico: true },
        { nota: 9, critico: true },
      ],
    });

    assert.deepEqual(result, { resultado: "APROVADA", mediaObtida: null });
  });

  it("aprova no limite exato (crítico = mínimo, média = mínima)", () => {
    const result = avaliarInspecaoIbc({
      ...limites,
      respostas: [
        { nota: 7, critico: true },
        { nota: 5, critico: false },
        { nota: 7, critico: false },
      ],
    });

    assert.deepEqual(result, { resultado: "APROVADA", mediaObtida: 6 });
  });
});
