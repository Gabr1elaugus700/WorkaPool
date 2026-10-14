import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { classificarBucketConciliacaoErp } from "../../../../../src/features/ibc/services/classificarBucketConciliacaoErp";
import {
  type BucketCicloConciliacaoErp,
  type IbcParaConciliacaoErp,
} from "../../../../../src/features/ibc/types/ConciliacaoErp.types";

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

describe("classificarBucketConciliacaoErp", () => {
  it("coloca cada IBC em um único bucket, nesta ordem", () => {
    const casos: ReadonlyArray<{
      nome: string;
      patch: Partial<IbcParaConciliacaoErp>;
      bucket: BucketCicloConciliacaoErp;
      entraNaSoma: boolean;
    }> = [
      {
        nome: "baixado vence substituição, venda e custódia",
        patch: {
          baixadoEm: new Date("2026-01-02T00:00:00.000Z"),
          convertedToContainerId: "destino",
          motivoBaixa: "VENDA",
          custodia: "CLIENTE",
        },
        bucket: "BAIXADOS",
        entraNaSoma: false,
      },
      {
        nome: "substituído fica fora dos vivos, mesmo com venda",
        patch: {
          convertedToContainerId: "destino",
          motivoBaixa: "VENDA",
          custodia: "CLIENTE",
        },
        bucket: "SUBSTITUIDOS",
        entraNaSoma: false,
      },
      {
        nome: "vendido não é empréstimo",
        patch: { custodia: "CLIENTE", motivoBaixa: "VENDA" },
        bucket: "VENDIDOS",
        entraNaSoma: false,
      },
      {
        nome: "troca #out não é empréstimo",
        patch: { custodia: "CLIENTE", motivoBaixa: "TROCA" },
        bucket: "TROCA",
        entraNaSoma: false,
      },
      {
        nome: "em viagem",
        patch: { custodia: "EM_VIAGEM" },
        bucket: "EM_VIAGEM",
        entraNaSoma: true,
      },
      {
        nome: "entrada no pátio entra na soma",
        patch: { custodia: "ENTRADA" },
        bucket: "ENTRADA",
        entraNaSoma: true,
      },
      {
        nome: "empréstimo no cliente",
        patch: { custodia: "CLIENTE" },
        bucket: "NO_CLIENTE",
        entraNaSoma: true,
      },
      {
        nome: "pátio",
        patch: { custodia: "PATIO" },
        bucket: "PATIO",
        entraNaSoma: true,
      },
    ];

    for (const caso of casos) {
      const classificacao = classificarBucketConciliacaoErp(linha(caso.patch));
      assert.equal(classificacao.bucket, caso.bucket, caso.nome);
      assert.equal(classificacao.entraNaSoma, caso.entraNaSoma, caso.nome);
    }
  });

  it("conta empréstimo no cliente sem derivar atraso", () => {
    const classificacao = classificarBucketConciliacaoErp(
      linha({
        custodia: "CLIENTE",
        cliente: "Cliente A",
        codCli: "10",
        numPed: "100",
        emprestimoVenceEm: new Date("2020-01-01T00:00:00.000Z"),
      }),
    );

    assert.deepEqual(classificacao, {
      bucket: "NO_CLIENTE",
      entraNaSoma: true,
      serialSemNf: false,
      parIdentificador: null,
    });
  });

  it("guarda o par da troca no #out, fora dos vivos", () => {
    const out = linha({
      identificador: "HMS00030",
      custodia: "CLIENTE",
      motivoBaixa: "TROCA",
      trocaEntradaIdentificador: "NHMS00067",
      cliente: "Cliente A",
      numPed: "100",
    });
    const classificacao = classificarBucketConciliacaoErp(out);

    assert.equal(classificacao.bucket, "TROCA");
    assert.equal(classificacao.entraNaSoma, false);
    assert.deepEqual([out.identificador, classificacao.parIdentificador], ["HMS00030", "NHMS00067"]);
  });

  it("deixa o #in da troca no bucket da custódia", () => {
    const entrada = classificarBucketConciliacaoErp(
      linha({
        identificador: "NHMS00067",
        custodia: "ENTRADA",
        aquisicao: "TROCA",
        loteId: null,
        numeroNf: null,
      }),
    );
    const patio = classificarBucketConciliacaoErp(
      linha({
        identificador: "NHMS00068",
        custodia: "PATIO",
        aquisicao: "TROCA",
        loteId: null,
        numeroNf: null,
      }),
    );

    assert.deepEqual(entrada, {
      bucket: "ENTRADA",
      entraNaSoma: true,
      serialSemNf: false,
      parIdentificador: null,
    });
    assert.deepEqual(patio, {
      bucket: "PATIO",
      entraNaSoma: true,
      serialSemNf: false,
      parIdentificador: null,
    });
  });

  it("recorta serial sem NF sem tirar o IBC do bucket de custódia", () => {
    const emViagemSemNf = classificarBucketConciliacaoErp(
      linha({ identificador: "H", custodia: "EM_VIAGEM", loteId: null, numeroNf: null }),
    );
    assert.equal(emViagemSemNf.bucket, "EM_VIAGEM");
    assert.equal(emViagemSemNf.entraNaSoma, true);
    assert.equal(emViagemSemNf.serialSemNf, true);

    const semLote = classificarBucketConciliacaoErp(
      linha({ identificador: "A", loteId: null, numeroNf: null }),
    );
    assert.equal(semLote.bucket, "PATIO");
    assert.equal(semLote.entraNaSoma, true);
    assert.equal(semLote.serialSemNf, true);

    const loteSemNumero = classificarBucketConciliacaoErp(
      linha({ identificador: "B", loteId: "lote-1", numeroNf: null }),
    );
    assert.equal(loteSemNumero.bucket, "PATIO");
    assert.equal(loteSemNumero.serialSemNf, true);

    const loteNuloComNumero = classificarBucketConciliacaoErp(
      linha({ identificador: "C", loteId: null, numeroNf: "NF-9" }),
    );
    assert.equal(loteNuloComNumero.serialSemNf, true);

    assert.equal(classificarBucketConciliacaoErp(linha({ identificador: "D" })).serialSemNf, false);

    const vendidoSemNf = classificarBucketConciliacaoErp(
      linha({
        identificador: "E",
        custodia: "CLIENTE",
        motivoBaixa: "VENDA",
        loteId: null,
        numeroNf: null,
      }),
    );
    assert.equal(vendidoSemNf.bucket, "VENDIDOS");
    assert.equal(vendidoSemNf.serialSemNf, false);

    const baixadoSemNf = classificarBucketConciliacaoErp(
      linha({
        identificador: "F",
        baixadoEm: new Date("2026-01-01T00:00:00.000Z"),
        loteId: null,
        numeroNf: null,
      }),
    );
    assert.equal(baixadoSemNf.bucket, "BAIXADOS");
    assert.equal(baixadoSemNf.serialSemNf, false);

    const substituidoSemNf = classificarBucketConciliacaoErp(
      linha({
        identificador: "G",
        convertedToContainerId: "novo",
        loteId: null,
        numeroNf: null,
      }),
    );
    assert.equal(substituidoSemNf.bucket, "SUBSTITUIDOS");
    assert.equal(substituidoSemNf.entraNaSoma, false);
    assert.equal(substituidoSemNf.serialSemNf, false);
  });
});
