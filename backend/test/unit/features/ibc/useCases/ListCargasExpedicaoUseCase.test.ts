import { describe, it, mock, after } from "node:test";
import assert from "node:assert/strict";
import { ListCargasExpedicaoUseCase } from "../../../../../src/features/ibc/useCases/ListCargasExpedicao.use-case";
import { IIbcExpedicaoRepository } from "../../../../../src/features/ibc/repositories/IIbcExpedicaoRepository";
import {
  AlocacaoIbcRecord,
  CargaExpedicaoPendente,
  CargaPedidoIbcSnapshot,
} from "../../../../../src/features/ibc/types/IbcExpedicao.types";

const buildPedidoIbc = (
  numPed: string,
  overrides: Partial<CargaPedidoIbcSnapshot> = {},
): CargaPedidoIbcSnapshot => ({
  numPed,
  codCli: "C1",
  cliente: "Cliente",
  quantidadeEsperadaTotal: 3,
  quantidadeEsperadaVenda: 2,
  quantidadeEsperadaEmprestimo: 1,
  ibcInvalido: false,
  ...overrides,
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

const buildCargaPendente = (
  overrides: Partial<CargaExpedicaoPendente> = {},
): CargaExpedicaoPendente => ({
  id: "carga-1",
  codCar: 101,
  destino: "Blumenau",
  situacao: "FECHADA",
  previsaoSaida: new Date("2026-08-25T10:00:00.000Z"),
  pedidosIbc: [buildPedidoIbc("1120")],
  alocacoes: [],
  ...overrides,
});

function buildRepo(cargas: CargaExpedicaoPendente[]) {
  const repo: Pick<IIbcExpedicaoRepository, "listCargasPendentesExpedicao"> = {
    listCargasPendentesExpedicao: mock.fn(async () => cargas),
  };
  return repo;
}

describe("ListCargasExpedicaoUseCase", () => {
  after(async () => {
    await new Promise((resolve) => setImmediate(resolve));
    await new Promise((resolve) => setTimeout(resolve, 50));
  });

  it("monta a lista só a partir da foto, numa única consulta", async () => {
    const repo = buildRepo([buildCargaPendente()]);

    const useCase = new ListCargasExpedicaoUseCase(
      repo as IIbcExpedicaoRepository,
    );
    const result = await useCase.execute();

    assert.strictEqual(result.cargas.length, 1);
    assert.strictEqual(
      (repo.listCargasPendentesExpedicao as ReturnType<typeof mock.fn>).mock
        .callCount(),
      1,
    );
  });

  it("mostra progresso parcial e não permite fechar expedição", async () => {
    const repo = buildRepo([
      buildCargaPendente({
        alocacoes: [
          buildAlocacao({ id: "a1", ibcId: "i1", identificador: "H1" }),
          buildAlocacao({ id: "a2", ibcId: "i2", identificador: "H2" }),
        ],
      }),
    ]);

    const result = await new ListCargasExpedicaoUseCase(
      repo as IIbcExpedicaoRepository,
    ).execute();

    const item = result.cargas[0];
    assert.strictEqual(item.codCar, 101);
    assert.strictEqual(item.situacao, "FECHADA");
    assert.strictEqual(item.quantidadeAlocada, 2);
    assert.strictEqual(item.quantidadeEsperadaTotal, 3);
    assert.strictEqual(item.temExpedicao, false);
    assert.strictEqual(item.podeFecharExpedicao, false);
    assert.ok(!("semIbc" in item));
  });

  it("marca podeFecharExpedicao quando todos os pedidos elegíveis estão supridos", async () => {
    const repo = buildRepo([
      buildCargaPendente({
        alocacoes: [
          buildAlocacao({ id: "a1", ibcId: "i1" }),
          buildAlocacao({ id: "a2", ibcId: "i2", identificador: "H2" }),
          buildAlocacao({ id: "a3", ibcId: "i3", identificador: "H3" }),
        ],
      }),
    ]);

    const result = await new ListCargasExpedicaoUseCase(
      repo as IIbcExpedicaoRepository,
    ).execute();

    assert.strictEqual(result.cargas[0].quantidadeAlocada, 3);
    assert.strictEqual(result.cargas[0].podeFecharExpedicao, true);
  });

  it("não conta Pedido IBC inválido no esperado e não permite fechar só com ele", async () => {
    const repo = buildRepo([
      buildCargaPendente({
        pedidosIbc: [
          buildPedidoIbc("1121", {
            ibcInvalido: true,
            quantidadeEsperadaTotal: 0,
            quantidadeEsperadaVenda: 0,
            quantidadeEsperadaEmprestimo: 0,
          }),
        ],
      }),
    ]);

    const result = await new ListCargasExpedicaoUseCase(
      repo as IIbcExpedicaoRepository,
    ).execute();

    const item = result.cargas[0];
    assert.strictEqual(item.quantidadeEsperadaTotal, 0);
    assert.strictEqual(item.podeFecharExpedicao, false);
  });

  it("soma esperado e alocado só dos pedidos elegíveis da foto", async () => {
    const repo = buildRepo([
      buildCargaPendente({
        pedidosIbc: [
          buildPedidoIbc("1120", { quantidadeEsperadaTotal: 2 }),
          buildPedidoIbc("1121", { quantidadeEsperadaTotal: 1 }),
          buildPedidoIbc("1122", {
            ibcInvalido: true,
            quantidadeEsperadaTotal: 0,
          }),
        ],
        alocacoes: [
          buildAlocacao({ id: "a1", ibcId: "i1", numPed: "1120" }),
          buildAlocacao({ id: "a2", ibcId: "i2", numPed: "1120" }),
          buildAlocacao({ id: "a3", ibcId: "i3", numPed: "1121" }),
        ],
      }),
    ]);

    const result = await new ListCargasExpedicaoUseCase(
      repo as IIbcExpedicaoRepository,
    ).execute();

    const item = result.cargas[0];
    assert.strictEqual(item.quantidadeEsperadaTotal, 3);
    assert.strictEqual(item.quantidadeAlocada, 3);
    assert.strictEqual(item.podeFecharExpedicao, true);
  });
});
