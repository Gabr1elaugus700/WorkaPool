import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { agregarConciliacaoErp } from "../../../../../src/features/ibc/services/agregarConciliacaoErp";
import type { IbcParaConciliacaoErp } from "../../../../../src/features/ibc/types/ConciliacaoErp.types";

function linha(overrides: Partial<IbcParaConciliacaoErp> = {}): IbcParaConciliacaoErp {
  return {
    identificador: "HMS00001",
    custodia: "PATIO",
    motivoBaixa: null,
    aquisicao: "COMPRA",
    baixadoEm: null,
    convertedToContainerId: null,
    loteId: "lote-1",
    numeroNf: "NF-1",
    trocaEntradaIdentificador: null,
    cliente: null,
    codCli: null,
    numPed: null,
    emprestimoVenceEm: null,
    ...overrides,
  };
}

describe("agregarConciliacaoErp", () => {
  it("explica 200 no ERP e 187 vivos com residual 13", () => {
    const vivos = Array.from({ length: 187 }, (_, index) =>
      linha({ identificador: `HMS${String(index).padStart(5, "0")}` }),
    );
    const foraDaSoma = [
      linha({ identificador: "VENDA", custodia: "CLIENTE", motivoBaixa: "VENDA" }),
      linha({ identificador: "TROCA", custodia: "CLIENTE", motivoBaixa: "TROCA" }),
      linha({ identificador: "BAIXA", baixadoEm: new Date("2026-03-01T00:00:00.000Z") }),
      linha({ identificador: "SUB", convertedToContainerId: "destino" }),
    ];

    const agregado = agregarConciliacaoErp([...vivos, ...foraDaSoma], {
      status: "available",
      quantity: 200,
    });

    assert.deepEqual(agregado.saldoErp, { status: "available", quantity: 200 });
    assert.equal(agregado.vivosWp, 187);
    assert.equal(agregado.residual, 13);
  });

  it("deixa o residual nulo quando o saldo ERP está indisponível", () => {
    const agregado = agregarConciliacaoErp([linha()], { status: "unavailable" });

    assert.equal(agregado.residual, null);
    assert.deepEqual(agregado.saldoErp, { status: "unavailable" });
    assert.equal(agregado.vivosWp, 1);
  });

  it("mantém residual negativo quando os vivos passam o saldo", () => {
    const vivos = Array.from({ length: 13 }, (_, index) =>
      linha({ identificador: `HMS${String(index).padStart(5, "0")}` }),
    );
    const agregado = agregarConciliacaoErp(vivos, { status: "available", quantity: 10 });

    assert.equal(agregado.vivosWp, 13);
    assert.equal(agregado.residual, -3);
  });

  it("preserva o decimal do saldo ERP no residual", () => {
    const agregado = agregarConciliacaoErp([linha()], { status: "available", quantity: 10.5 });

    assert.equal(agregado.residual, 9.5);
  });

  it("marca NF sem serializar como indisponível, sem contagem inventada", () => {
    const agregado = agregarConciliacaoErp(
      [linha(), linha({ identificador: "HMS00002", loteId: "lote-2", numeroNf: "NF-50" })],
      { status: "available", quantity: 50 },
    );

    assert.deepEqual(agregado.nfSemSerializar, { status: "indisponivel", count: null });
  });

  it("soma vivos só nos quatro buckets que entram na soma", () => {
    const agregado = agregarConciliacaoErp(
      [
        linha({ identificador: "patio", custodia: "PATIO" }),
        linha({ identificador: "viagem", custodia: "EM_VIAGEM" }),
        linha({ identificador: "entrada", custodia: "ENTRADA" }),
        linha({
          identificador: "cliente",
          custodia: "CLIENTE",
          cliente: "Cliente A",
          numPed: "100",
          emprestimoVenceEm: new Date("2020-01-01T00:00:00.000Z"),
        }),
        linha({ identificador: "sem-nf", custodia: "PATIO", loteId: null, numeroNf: null }),
        linha({ identificador: "venda", custodia: "CLIENTE", motivoBaixa: "VENDA" }),
        linha({
          identificador: "troca",
          custodia: "CLIENTE",
          motivoBaixa: "TROCA",
          trocaEntradaIdentificador: "NHMS00067",
        }),
        linha({ identificador: "baixa", baixadoEm: new Date("2026-01-01T00:00:00.000Z") }),
        linha({ identificador: "sub", convertedToContainerId: "destino" }),
      ],
      { status: "available", quantity: 200 },
    );

    const somaDosQueEntram = agregado.buckets
      .filter((bucket) => bucket.entraNaSoma)
      .reduce((total, bucket) => total + bucket.count, 0);

    assert.equal(agregado.vivosWp, somaDosQueEntram);
    assert.equal(agregado.vivosWp, 5);
    assert.equal(agregado.residual, 195);
    assert.deepEqual(
      agregado.buckets.map((bucket) => [bucket.bucket, bucket.count, bucket.entraNaSoma]),
      [
        ["BAIXADOS", 1, false],
        ["SUBSTITUIDOS", 1, false],
        ["VENDIDOS", 1, false],
        ["TROCA", 1, false],
        ["EM_VIAGEM", 1, true],
        ["ENTRADA", 1, true],
        ["NO_CLIENTE", 1, true],
        ["PATIO", 2, true],
      ],
    );
    assert.deepEqual(agregado.serialSemNf, {
      recorte: "SERIAL_SEM_NF",
      count: 1,
      entraNaSoma: false,
    });
  });
});
