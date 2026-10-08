import { describe, it, mock, after } from "node:test";
import assert from "node:assert/strict";
import { GetCargaExpedicaoDetailUseCase } from "../../../../../src/features/ibc/useCases/GetCargaExpedicaoDetail.use-case";
import { IIbcExpedicaoRepository } from "../../../../../src/features/ibc/repositories/IIbcExpedicaoRepository";
import { AppError } from "../../../../../src/utils/AppError";
import {
  AlocacaoIbcRecord,
  CargaExpedicaoRef,
  CargaPedidoIbcSnapshot,
} from "../../../../../src/features/ibc/types/IbcExpedicao.types";

const buildCarga = (
  overrides: Partial<CargaExpedicaoRef> = {},
): CargaExpedicaoRef => ({
  id: "carga-1",
  codCar: 101,
  destino: "Blumenau",
  situacao: "FECHADA",
  previsaoSaida: new Date("2026-08-25T10:00:00.000Z"),
  ...overrides,
});

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

type RepoMock = Pick<
  IIbcExpedicaoRepository,
  | "getCargaByCodCar"
  | "listPedidosIbcByCargaId"
  | "listAlocacoesByCargaId"
  | "findExpedicaoByCargaId"
>;

const buildRepo = (overrides: Partial<RepoMock> = {}): RepoMock => ({
  getCargaByCodCar: mock.fn(async () => buildCarga()),
  listPedidosIbcByCargaId: mock.fn(async () => [buildPedidoIbc("1120")]),
  listAlocacoesByCargaId: mock.fn(async () => []),
  findExpedicaoByCargaId: mock.fn(async () => null),
  ...overrides,
});

const assertAppError = (code: string) => (error: unknown) => {
  assert.ok(error instanceof AppError);
  assert.strictEqual(error.code, code);
  return true;
};

describe("GetCargaExpedicaoDetailUseCase", () => {
  after(async () => {
    await new Promise((resolve) => setImmediate(resolve));
    await new Promise((resolve) => setTimeout(resolve, 50));
  });

  it("mostra progresso 2 de 3 do pedido lido da foto", async () => {
    const listPedidosIbcByCargaId = mock.fn(async (_cargaId: string) => [
      buildPedidoIbc("1120"),
    ]);
    const repo = buildRepo({
      listPedidosIbcByCargaId,
      listAlocacoesByCargaId: mock.fn(async () => [
        buildAlocacao({ id: "a1", ibcId: "i1", identificador: "H1" }),
        buildAlocacao({ id: "a2", ibcId: "i2", identificador: "H2" }),
      ]),
    });

    const detail = await new GetCargaExpedicaoDetailUseCase(
      repo as IIbcExpedicaoRepository,
    ).execute({ codCar: 101 });

    assert.strictEqual(detail.codCar, 101);
    assert.strictEqual(detail.pedidos.length, 1);
    assert.strictEqual(detail.pedidos[0].numPed, "1120");
    assert.strictEqual(detail.pedidos[0].cliente, "Cliente");
    assert.strictEqual(detail.pedidos[0].quantidadeAlocada, 2);
    assert.strictEqual(detail.pedidos[0].quantidadeEsperadaTotal, 3);
    assert.strictEqual(detail.podeFecharExpedicao, false);
    assert.deepEqual(listPedidosIbcByCargaId.mock.calls[0].arguments, [
      "carga-1",
    ]);
  });

  it("inclui Pedido IBC inválido da foto com alerta, sem somar no esperado", async () => {
    const repo = buildRepo({
      listPedidosIbcByCargaId: mock.fn(async () => [
        buildPedidoIbc("1120", { quantidadeEsperadaTotal: 2 }),
        buildPedidoIbc("1121", {
          ibcInvalido: true,
          quantidadeEsperadaTotal: 0,
          quantidadeEsperadaVenda: 0,
          quantidadeEsperadaEmprestimo: 0,
        }),
      ]),
    });

    const detail = await new GetCargaExpedicaoDetailUseCase(
      repo as IIbcExpedicaoRepository,
    ).execute({ codCar: 101 });

    assert.strictEqual(detail.pedidos.length, 2);
    assert.strictEqual(detail.pedidos[1].ibcInvalido, true);
    assert.strictEqual(detail.quantidadeEsperadaTotal, 2);
  });

  it("retorna 404 quando carga não existe", async () => {
    const repo = buildRepo({ getCargaByCodCar: mock.fn(async () => null) });

    await assert.rejects(
      () =>
        new GetCargaExpedicaoDetailUseCase(
          repo as IIbcExpedicaoRepository,
        ).execute({ codCar: 404 }),
      assertAppError("IBC_CARGA_NOT_FOUND"),
    );
  });

  it("recusa carga ABERTA com IBC_CARGA_NAO_FECHADA", async () => {
    const repo = buildRepo({
      getCargaByCodCar: mock.fn(async () => buildCarga({ situacao: "ABERTA" })),
    });

    await assert.rejects(
      () =>
        new GetCargaExpedicaoDetailUseCase(
          repo as IIbcExpedicaoRepository,
        ).execute({ codCar: 101 }),
      assertAppError("IBC_CARGA_NAO_FECHADA"),
    );
  });

  it("recusa carga FECHADA sem foto com IBC_CARGA_SEM_FOTO_EXPEDICAO", async () => {
    const repo = buildRepo({
      listPedidosIbcByCargaId: mock.fn(async () => []),
    });

    await assert.rejects(
      () =>
        new GetCargaExpedicaoDetailUseCase(
          repo as IIbcExpedicaoRepository,
        ).execute({ codCar: 101 }),
      assertAppError("IBC_CARGA_SEM_FOTO_EXPEDICAO"),
    );
  });
});
