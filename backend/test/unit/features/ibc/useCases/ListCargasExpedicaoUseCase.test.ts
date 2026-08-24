import { describe, it, mock, after } from "node:test";
import assert from "node:assert/strict";
import { ListCargasExpedicaoUseCase } from "../../../../../src/features/ibc/useCases/ListCargasExpedicao.use-case";
import { IIbcExpedicaoRepository } from "../../../../../src/features/ibc/repositories/IIbcExpedicaoRepository";
import { PedidoCargo } from "../../../../../src/features/pedidos/types/PedidoCargo.types";
import {
  AlocacaoIbcRecord,
  CargaExpedicaoRef,
} from "../../../../../src/features/ibc/types/IbcExpedicao.types";

const buildCarga = (
  overrides: Partial<CargaExpedicaoRef> = {},
): CargaExpedicaoRef => ({
  id: "carga-1",
  codCar: 101,
  destino: "Blumenau",
  situacao: "ABERTA",
  previsaoSaida: new Date("2026-08-25T10:00:00.000Z"),
  ...overrides,
});

const buildPedido = (
  numPed: string,
  overrides: Partial<{
    isContainer: boolean;
    quantidadeEsperadaTotal: number;
    ibcInvalido: boolean;
  }> = {},
): PedidoCargo =>
  new PedidoCargo({
    numPed,
    cliente: "Cliente",
    cidade: "Blumenau",
    estado: "SC",
    vendedor: "Vendedor",
    peso: 100,
    qtdOri: 1,
    isContainer: overrides.isContainer ?? true,
    quantidadeEsperadaTotal: overrides.quantidadeEsperadaTotal ?? 3,
    quantidadeEsperadaVenda: 2,
    quantidadeEsperadaEmprestimo: 1,
    ibcInvalido: overrides.ibcInvalido ?? false,
  });

const buildAlocacao = (
  overrides: Partial<AlocacaoIbcRecord> = {},
): AlocacaoIbcRecord => ({
  id: "aloc-1",
  ibcId: "ibc-1",
  cargaId: "carga-1",
  numPed: "1120",
  alocadoPorId: "almox-1",
  alocadoEm: new Date("2026-08-24T12:00:00.000Z"),
  expedicaoIbcId: null,
  identificador: "H0045",
  ...overrides,
});

describe("ListCargasExpedicaoUseCase", () => {
  after(async () => {
    await new Promise((resolve) => setImmediate(resolve));
    await new Promise((resolve) => setTimeout(resolve, 50));
  });

  it("mostra progresso parcial em carga ABERTA e não permite fechar expedição", async () => {
    const repo: Pick<
      IIbcExpedicaoRepository,
      | "listCargasAbertaOuFechada"
      | "getPedidosByCarga"
      | "listAlocacoesByCargaId"
      | "findExpedicaoByCargaId"
    > = {
      listCargasAbertaOuFechada: mock.fn(async () => [buildCarga()]),
      getPedidosByCarga: mock.fn(async () => [buildPedido("1120")]),
      listAlocacoesByCargaId: mock.fn(async () => [
        buildAlocacao({ id: "a1", ibcId: "i1", identificador: "H1" }),
        buildAlocacao({ id: "a2", ibcId: "i2", identificador: "H2" }),
      ]),
      findExpedicaoByCargaId: mock.fn(async () => null),
    };

    const useCase = new ListCargasExpedicaoUseCase(
      repo as IIbcExpedicaoRepository,
    );
    const result = await useCase.execute();

    assert.strictEqual(result.cargas.length, 1);
    const item = result.cargas[0];
    assert.strictEqual(item.codCar, 101);
    assert.strictEqual(item.quantidadeAlocada, 2);
    assert.strictEqual(item.quantidadeEsperadaTotal, 3);
    assert.strictEqual(item.semIbc, false);
    assert.strictEqual(item.podeFecharExpedicao, false);
    assert.strictEqual(item.temExpedicao, false);
  });

  it("lista carga sem pedidos IBC com indicador semIbc e sem ações", async () => {
    const repo: Pick<
      IIbcExpedicaoRepository,
      | "listCargasAbertaOuFechada"
      | "getPedidosByCarga"
      | "listAlocacoesByCargaId"
      | "findExpedicaoByCargaId"
    > = {
      listCargasAbertaOuFechada: mock.fn(async () => [
        buildCarga({ id: "carga-2", codCar: 202, situacao: "FECHADA" }),
      ]),
      getPedidosByCarga: mock.fn(async () => [
        buildPedido("9999", {
          isContainer: false,
          quantidadeEsperadaTotal: 0,
        }),
      ]),
      listAlocacoesByCargaId: mock.fn(async () => []),
      findExpedicaoByCargaId: mock.fn(async () => null),
    };

    const useCase = new ListCargasExpedicaoUseCase(
      repo as IIbcExpedicaoRepository,
    );
    const result = await useCase.execute();

    const item = result.cargas[0];
    assert.strictEqual(item.semIbc, true);
    assert.strictEqual(item.podeFecharExpedicao, false);
    assert.strictEqual(item.quantidadeEsperadaTotal, 0);
  });

  it("não marca semIbc quando só há Pedido IBC inválido (251001) — permanece acionável", async () => {
    const repo: Pick<
      IIbcExpedicaoRepository,
      | "listCargasAbertaOuFechada"
      | "getPedidosByCarga"
      | "listAlocacoesByCargaId"
      | "findExpedicaoByCargaId"
    > = {
      listCargasAbertaOuFechada: mock.fn(async () => [
        buildCarga({ id: "carga-3", codCar: 303, situacao: "ABERTA" }),
      ]),
      getPedidosByCarga: mock.fn(async () => [
        buildPedido("1121", {
          isContainer: false,
          quantidadeEsperadaTotal: 0,
          ibcInvalido: true,
        }),
      ]),
      listAlocacoesByCargaId: mock.fn(async () => []),
      findExpedicaoByCargaId: mock.fn(async () => null),
    };

    const useCase = new ListCargasExpedicaoUseCase(
      repo as IIbcExpedicaoRepository,
    );
    const result = await useCase.execute();

    const item = result.cargas[0];
    assert.strictEqual(item.semIbc, false);
    assert.strictEqual(item.quantidadeEsperadaTotal, 0);
    assert.strictEqual(item.podeFecharExpedicao, false);
  });

  it("marca podeFecharExpedicao quando FECHADA, completa e sem expedição", async () => {
    const repo: Pick<
      IIbcExpedicaoRepository,
      | "listCargasAbertaOuFechada"
      | "getPedidosByCarga"
      | "listAlocacoesByCargaId"
      | "findExpedicaoByCargaId"
    > = {
      listCargasAbertaOuFechada: mock.fn(async () => [
        buildCarga({ situacao: "FECHADA" }),
      ]),
      getPedidosByCarga: mock.fn(async () => [buildPedido("1120")]),
      listAlocacoesByCargaId: mock.fn(async () => [
        buildAlocacao({ id: "a1", ibcId: "i1" }),
        buildAlocacao({ id: "a2", ibcId: "i2", identificador: "H2" }),
        buildAlocacao({ id: "a3", ibcId: "i3", identificador: "H3" }),
      ]),
      findExpedicaoByCargaId: mock.fn(async () => null),
    };

    const useCase = new ListCargasExpedicaoUseCase(
      repo as IIbcExpedicaoRepository,
    );
    const result = await useCase.execute();

    assert.strictEqual(result.cargas[0].podeFecharExpedicao, true);
  });
});
