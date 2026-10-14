import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formatNumber } from "@/utils/formatNumber";
import type { ItemConciliacaoErp } from "../types/conciliacaoErp.types";
import { conciliacaoErpApresentacao } from "./conciliacaoErp.utils";

function item(overrides: Partial<ItemConciliacaoErp> = {}): ItemConciliacaoErp {
  return {
    id: "1",
    identificador: "HM1001",
    cliente: null,
    codCli: null,
    numPed: null,
    emprestimoVenceEm: null,
    parIdentificador: null,
    numeroNf: null,
    baixadoEm: null,
    ...overrides,
  };
}

describe("conciliacaoErpApresentacao", () => {
  it("mostra o residual com sinal e indisponível quando o saldo falta", () => {
    assert.equal(conciliacaoErpApresentacao.residual(13), `+${formatNumber(13)}`);
    assert.equal(conciliacaoErpApresentacao.residual(-4), formatNumber(-4));
    assert.equal(conciliacaoErpApresentacao.residual(0), formatNumber(0));
    assert.equal(conciliacaoErpApresentacao.residual(null), "indisponível");
    assert.equal(conciliacaoErpApresentacao.saldo({ status: "unavailable" }), "indisponível");
    assert.equal(
      conciliacaoErpApresentacao.saldo({ status: "available", quantity: 200.5 }),
      formatNumber(200.5),
    );
  });

  it("não prefixa o residual negativo com um segundo sinal", () => {
    const texto = conciliacaoErpApresentacao.residual(-13);
    assert.equal(texto.startsWith("+"), false);
    assert.notEqual(texto, "indisponível");
  });

  it("lista o vencimento do empréstimo sem tratar a data como atraso", () => {
    const emprestimo = item({
      cliente: "Piscina Aurora",
      numPed: "W100",
      emprestimoVenceEm: "2026-07-12T15:30:00.000Z",
    });
    assert.deepEqual(conciliacaoErpApresentacao.colunas("NO_CLIENTE", [emprestimo]), [
      "cliente",
      "pedido",
      "vencimento",
    ]);
    assert.equal(conciliacaoErpApresentacao.celula(emprestimo, "vencimento"), "12/07/2026");
    assert.equal(conciliacaoErpApresentacao.rotuloColuna("vencimento"), "Vencimento do empréstimo");
    assert.equal(conciliacaoErpApresentacao.rotuloColuna("vencimento").toLowerCase().includes("atras"), false);
  });

  it("aceita só os buckets da consulta", () => {
    assert.equal(conciliacaoErpApresentacao.isBucket("PATIO"), true);
    assert.equal(conciliacaoErpApresentacao.isBucket("SERIAL_SEM_NF"), true);
    assert.equal(conciliacaoErpApresentacao.isBucket("FOO"), false);
    assert.equal(conciliacaoErpApresentacao.isBucket(null), false);
  });

  it("mostra a NF só quando o identificador tem número", () => {
    const comNf = item({ numeroNf: "12345" });
    assert.deepEqual(conciliacaoErpApresentacao.colunas("PATIO", [comNf]), ["nf"]);
    assert.deepEqual(conciliacaoErpApresentacao.colunas("PATIO", [item()]), []);
    assert.equal(conciliacaoErpApresentacao.celula(comNf, "nf"), "12345");
  });
});
