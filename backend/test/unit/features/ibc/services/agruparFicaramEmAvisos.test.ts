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
  it("agrupa só venda sem data de empréstimo", () => {
    const avisos = agruparFicaramEmAvisos(
      [ficou("100", "VENDA", "ibc-1")],
      new Map([["ibc-1", "2026-12-01T00:00:00.000Z"]]),
    );

    assert.deepEqual(avisos, [
      {
        numPed: "100",
        codCli: "10",
        cliente: "Cliente A",
        itens: [
          {
            ibcId: "ibc-1",
            identificador: "HM-ibc-1",
            modalidade: "VENDA",
            emprestimoVenceEm: null,
          },
        ],
      },
    ]);
  });

  it("agrupa só empréstimo copiando o vencimento já buscado", () => {
    const avisos = agruparFicaramEmAvisos(
      [ficou("100", "EMPRESTIMO", "ibc-1")],
      new Map([["ibc-1", "2027-01-11T00:00:00.000Z"]]),
    );

    assert.equal(avisos.length, 1);
    assert.deepEqual(avisos[0]?.itens, [
      {
        ibcId: "ibc-1",
        identificador: "HM-ibc-1",
        modalidade: "EMPRESTIMO",
        emprestimoVenceEm: "2027-01-11T00:00:00.000Z",
      },
    ]);
  });

  it("junta venda e empréstimo do mesmo pedido num único aviso", () => {
    const avisos = agruparFicaramEmAvisos(
      [ficou("100", "VENDA", "ibc-1"), ficou("100", "EMPRESTIMO", "ibc-2")],
      new Map([["ibc-2", "2027-01-11T00:00:00.000Z"]]),
    );

    assert.equal(avisos.length, 1);
    assert.deepEqual(
      avisos[0]?.itens.map((item) => item.modalidade),
      ["VENDA", "EMPRESTIMO"],
    );
    assert.equal(avisos[0]?.itens[0]?.emprestimoVenceEm, null);
    assert.equal(avisos[0]?.itens[1]?.emprestimoVenceEm, "2027-01-11T00:00:00.000Z");
  });

  it("separa dois pedidos", () => {
    const avisos = agruparFicaramEmAvisos(
      [
        ficou("100", "VENDA", "ibc-1", "Cliente A"),
        ficou("200", "EMPRESTIMO", "ibc-2", "Cliente B"),
      ],
      new Map([["ibc-2", "2027-01-11T00:00:00.000Z"]]),
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
