import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { conciliacaoViagem } from "../../../../../src/features/ibc/services/conciliacaoViagem";
import { CargaPedidoIbcSnapshot } from "../../../../../src/features/ibc/types/IbcExpedicao.types";

const pedido = (
  overrides: Partial<CargaPedidoIbcSnapshot> & Pick<CargaPedidoIbcSnapshot, "numPed">,
): CargaPedidoIbcSnapshot => ({
  codCli: "C1",
  cliente: "Cliente",
  quantidadeEsperadaTotal: 1,
  quantidadeEsperadaVenda: 1,
  quantidadeEsperadaEmprestimo: 0,
  ibcInvalido: false,
  posCar: null,
  gruposCodigo: [],
  ...overrides,
});

describe("conciliacaoViagem", () => {
  it("vence o empréstimo 90 dias depois do fechamento da viagem, em UTC", () => {
    const iniciado = new Date("2026-10-13T15:00:00.000Z");
    assert.equal(conciliacaoViagem.prazoDias, 90);
    assert.equal(conciliacaoViagem.vencimento(iniciado).toISOString(), "2027-01-11T15:00:00.000Z");
  });

  it("usa a mesma chave de cliente do relatório de viagem", () => {
    assert.equal(conciliacaoViagem.chaveCliente("10", "Acme"), "10\u0000Acme");
    assert.equal(conciliacaoViagem.chaveCliente(null, "Avulso"), "\u0000Avulso");
  });

  it("sugere venda ou empréstimo só quando o pedido é puro", () => {
    assert.equal(conciliacaoViagem.sugerirModalidade(2, 0), "VENDA");
    assert.equal(conciliacaoViagem.sugerirModalidade(0, 1), "EMPRESTIMO");
    assert.equal(conciliacaoViagem.sugerirModalidade(1, 1), null);
    assert.equal(conciliacaoViagem.sugerirModalidade(0, 0), null);
  });

  it("deriva a modalidade do pedido e recusa modalidade no corpo", () => {
    const incluso = pedido({ numPed: "1", quantidadeEsperadaVenda: 2, quantidadeEsperadaEmprestimo: 0 });
    const emprestimo = pedido({ numPed: "2", quantidadeEsperadaTotal: 1, quantidadeEsperadaVenda: 0, quantidadeEsperadaEmprestimo: 1 });
    const misto = pedido({ numPed: "3", quantidadeEsperadaVenda: 1, quantidadeEsperadaEmprestimo: 1 });
    assert.deepEqual(
      conciliacaoViagem.resolverApontamento({ destino: "FICOU", numPed: "1", modalidade: null, pedido: incluso }),
      { ok: true, numPed: "1", modalidade: "VENDA" },
    );
    assert.deepEqual(
      conciliacaoViagem.resolverApontamento({ destino: "TROCA", numPed: "2", modalidade: null, pedido: emprestimo }),
      { ok: true, numPed: "2", modalidade: "EMPRESTIMO" },
    );
    assert.equal(conciliacaoViagem.resolverApontamento({ destino: "FICOU", numPed: null, modalidade: null, pedido: null }).ok, false);
    assert.equal(
      conciliacaoViagem.resolverApontamento({ destino: "FICOU", numPed: "1", modalidade: "VENDA", pedido: incluso }).ok,
      false,
    );
    assert.equal(
      conciliacaoViagem.resolverApontamento({ destino: "RETORNOU", numPed: "1", modalidade: null, pedido: incluso }).ok,
      false,
    );
    assert.deepEqual(
      conciliacaoViagem.resolverApontamento({ destino: "RETORNOU", numPed: null, modalidade: null, pedido: null }),
      { ok: true, numPed: null, modalidade: null },
    );
    assert.equal(conciliacaoViagem.resolverApontamento({ destino: "FICOU", numPed: "3", modalidade: null, pedido: misto }).ok, false);
    assert.equal(conciliacaoViagem.resolverApontamento({ destino: "FICOU", numPed: "9", modalidade: null, pedido: null }).ok, false);
  });

  it("esconde o pedido da saída na viagem aberta e conserva o da viagem fechada", () => {
    assert.deepEqual(conciliacaoViagem.pedidoNaVolta({
      viagemFechada: false, destino: "FICOU", numPedAlocacao: "10", numPedMarca: null,
    }), { exibido: null, apontado: null });
    assert.deepEqual(conciliacaoViagem.pedidoNaVolta({
      viagemFechada: false, destino: "TROCA", numPedAlocacao: "10", numPedMarca: "20",
    }), { exibido: "20", apontado: "20" });
    assert.deepEqual(conciliacaoViagem.pedidoNaVolta({
      viagemFechada: false, destino: "RETORNOU", numPedAlocacao: "10", numPedMarca: null,
    }), { exibido: null, apontado: null });
    assert.deepEqual(conciliacaoViagem.pedidoNaVolta({
      viagemFechada: true, destino: null, numPedAlocacao: "10", numPedMarca: null,
    }), { exibido: "10", apontado: null });
    assert.deepEqual(conciliacaoViagem.pedidoNaVolta({
      viagemFechada: true, destino: "FICOU", numPedAlocacao: "10", numPedMarca: null,
    }), { exibido: "10", apontado: "10" });
  });

  it("soma esperado e apontado só nos pedidos elegíveis", () => {
    const progresso = conciliacaoViagem.progressoPedidos([
      pedido({ numPed: "20", quantidadeEsperadaTotal: 2, quantidadeEsperadaVenda: 0, quantidadeEsperadaEmprestimo: 2, posCar: 2 }),
      pedido({ numPed: "10", quantidadeEsperadaTotal: 1, posCar: 1 }),
      pedido({ numPed: "30", quantidadeEsperadaVenda: 1, quantidadeEsperadaEmprestimo: 1 }),
    ], ["20", "20", null, "10"]);
    assert.deepEqual(progresso, [
      { numPed: "10", codCli: "C1", cliente: "Cliente", incluso: true, quantidadeEsperada: 1, quantidadeApontada: 1 },
      { numPed: "20", codCli: "C1", cliente: "Cliente", incluso: false, quantidadeEsperada: 2, quantidadeApontada: 2 },
    ]);
  });

  it("agrupa clientes elegíveis na ordem de entrega", () => {
    const clientes = conciliacaoViagem.clientes([
      pedido({ numPed: "20", codCli: "A", cliente: "Acme", posCar: 3 }),
      pedido({ numPed: "21", codCli: "A", cliente: "Acme", posCar: 3, quantidadeEsperadaTotal: 2 }),
      pedido({ numPed: "10", codCli: "B", cliente: "Beta", posCar: 1, quantidadeEsperadaVenda: 0, quantidadeEsperadaEmprestimo: 1 }),
      pedido({ numPed: "30", ibcInvalido: true, quantidadeEsperadaTotal: 0 }),
    ]);
    assert.deepEqual(clientes, [
      { chaveCliente: "B\u0000Beta", codCli: "B", cliente: "Beta" },
      { chaveCliente: "A\u0000Acme", codCli: "A", cliente: "Acme" },
    ]);
  });
});
