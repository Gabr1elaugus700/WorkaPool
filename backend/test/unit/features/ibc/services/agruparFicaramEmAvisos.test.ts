import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { agruparFicaramEmAvisos } from "../../../../../src/features/ibc/services/agruparFicaramEmAvisos";
import { FicouNaViagem } from "../../../../../src/features/ibc/services/planejarFechamentoViagem";

function ficou(
  numPed: string,
  modalidade: FicouNaViagem["modalidade"],
  ibcId: string,
  cliente = "Cliente A",
): FicouNaViagem {
  return {
    ibcId,
    identificador: `HM-${ibcId}`,
    modalidade,
    codCli: "10",
    cliente,
    numPed,
  };
}

describe("agruparFicaramEmAvisos", () => {
  it("descarta incluso e não gera aviso", () => {
    const avisos = agruparFicaramEmAvisos(
      [ficou("100", "VENDA", "ibc-1")],
      new Map([["ibc-1", "2026-12-01T00:00:00.000Z"]]),
    );

    assert.deepEqual(avisos, []);
  });

  it("agrupa só empréstimo copiando o vencimento já buscado", () => {
    const avisos = agruparFicaramEmAvisos(
      [ficou("100", "EMPRESTIMO", "ibc-1")],
      new Map([["ibc-1", "2027-01-17T00:00:00.000Z"]]),
    );

    assert.equal(avisos.length, 1);
    assert.deepEqual(avisos[0]?.itens, [
      {
        ibcId: "ibc-1",
        identificador: "HM-ibc-1",
        modalidade: "EMPRESTIMO",
        emprestimoVenceEm: "2027-01-17T00:00:00.000Z",
      },
    ]);
  });

  it("dois empréstimos e um incluso geram aviso só dos empréstimos", () => {
    const avisos = agruparFicaramEmAvisos(
      [
        ficou("200", "VENDA", "ibc-inc", "Cliente Incluso"),
        ficou("100", "EMPRESTIMO", "ibc-1", "Cliente Volta"),
        ficou("100", "EMPRESTIMO", "ibc-2", "Cliente Volta"),
      ],
      new Map([
        ["ibc-1", "2027-01-17T00:00:00.000Z"],
        ["ibc-2", "2027-01-17T00:00:00.000Z"],
        ["ibc-inc", "2027-01-17T00:00:00.000Z"],
      ]),
    );

    assert.equal(avisos.length, 1);
    assert.equal(avisos[0]?.numPed, "100");
    assert.equal(avisos[0]?.cliente, "Cliente Volta");
    assert.deepEqual(
      avisos[0]?.itens.map((item) => item.identificador),
      ["HM-ibc-1", "HM-ibc-2"],
    );
    assert.deepEqual(
      avisos[0]?.itens.map((item) => item.modalidade),
      ["EMPRESTIMO", "EMPRESTIMO"],
    );
    assert.deepEqual(
      avisos[0]?.itens.map((item) => item.emprestimoVenceEm),
      ["2027-01-17T00:00:00.000Z", "2027-01-17T00:00:00.000Z"],
    );
  });

  it("separa dois pedidos de empréstimo e deixa o incluso de fora", () => {
    const avisos = agruparFicaramEmAvisos(
      [
        ficou("100", "EMPRESTIMO", "ibc-1", "Cliente A"),
        ficou("300", "VENDA", "ibc-inc", "Cliente Incluso"),
        ficou("200", "EMPRESTIMO", "ibc-2", "Cliente B"),
      ],
      new Map([
        ["ibc-1", "2027-01-17T00:00:00.000Z"],
        ["ibc-2", "2027-01-17T00:00:00.000Z"],
      ]),
    );

    assert.deepEqual(
      avisos.map((aviso) => ({ numPed: aviso.numPed, cliente: aviso.cliente })),
      [
        { numPed: "100", cliente: "Cliente A" },
        { numPed: "200", cliente: "Cliente B" },
      ],
    );
  });

  it("devolve lista vazia quando ninguém ficou", () => {
    assert.deepEqual(agruparFicaramEmAvisos([], new Map()), []);
  });
});
