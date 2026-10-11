import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { resolverAptidaoIbc } from "../../../../../src/features/ibc/services/resolverAptidaoIbc";

describe("resolverAptidaoIbc", () => {
  it("mantém DATA_LIMITE já marcado mesmo com todas as inspeções aprovadas", () => {
    const result = resolverAptidaoIbc({
      motivoAtual: "DATA_LIMITE",
      dataLimiteVencida: false,
      ultimasPorChecklistVinculado: ["APROVADA"],
    });

    assert.deepEqual(result, { aptidao: "INAPTO", motivoInaptidao: "DATA_LIMITE" });
  });

  it("marca DATA_LIMITE quando a data limite vence agora, prevalecendo sobre a reprovação", () => {
    const result = resolverAptidaoIbc({
      motivoAtual: null,
      dataLimiteVencida: true,
      ultimasPorChecklistVinculado: ["REPROVADA"],
    });

    assert.deepEqual(result, { aptidao: "INAPTO", motivoInaptidao: "DATA_LIMITE" });
  });

  it("torna INAPTO por INSPECAO_REPROVADA quando alguma última inspeção foi reprovada", () => {
    const result = resolverAptidaoIbc({
      motivoAtual: null,
      dataLimiteVencida: false,
      ultimasPorChecklistVinculado: ["APROVADA", "REPROVADA"],
    });

    assert.deepEqual(result, { aptidao: "INAPTO", motivoInaptidao: "INSPECAO_REPROVADA" });
  });

  it("volta a APTO quando todas as últimas inspeções estão aprovadas", () => {
    const result = resolverAptidaoIbc({
      motivoAtual: "INSPECAO_REPROVADA",
      dataLimiteVencida: false,
      ultimasPorChecklistVinculado: ["APROVADA", "APROVADA"],
    });

    assert.deepEqual(result, { aptidao: "APTO", motivoInaptidao: null });
  });

  it("considera APTO com Soda aprovada e Estrutural nunca inspecionado (fora da lista)", () => {
    const result = resolverAptidaoIbc({
      motivoAtual: null,
      dataLimiteVencida: false,
      ultimasPorChecklistVinculado: ["APROVADA"],
    });

    assert.deepEqual(result, { aptidao: "APTO", motivoInaptidao: null });
  });

  it("limpa AGUARDANDO_INSPECAO quando a inspeção é aprovada", () => {
    const result = resolverAptidaoIbc({
      motivoAtual: "AGUARDANDO_INSPECAO",
      dataLimiteVencida: false,
      ultimasPorChecklistVinculado: ["APROVADA"],
    });

    assert.deepEqual(result, { aptidao: "APTO", motivoInaptidao: null });
  });
});
