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

  it("exige modalidade só quando o IBC ficou no cliente", () => {
    assert.deepEqual(conciliacaoViagem.modalidadeDaMarca("FICOU", "VENDA"), { ok: true, modalidade: "VENDA" });
    assert.deepEqual(conciliacaoViagem.modalidadeDaMarca("FICOU", null), { ok: false });
    assert.deepEqual(conciliacaoViagem.modalidadeDaMarca("RETORNOU", null), { ok: true, modalidade: null });
    assert.deepEqual(conciliacaoViagem.modalidadeDaMarca("TROCA", "EMPRESTIMO"), { ok: false });
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
