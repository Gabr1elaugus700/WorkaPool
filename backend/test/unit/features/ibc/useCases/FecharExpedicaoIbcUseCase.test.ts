import { describe, it, mock, after } from "node:test";
import assert from "node:assert/strict";
import { FecharExpedicaoIbcUseCase } from "../../../../../src/features/ibc/useCases/FecharExpedicaoIbc.use-case";
import { IIbcExpedicaoRepository } from "../../../../../src/features/ibc/repositories/IIbcExpedicaoRepository";
import { AppError } from "../../../../../src/utils/AppError";
import {
  AlocacaoIbcRecord,
  CargaExpedicaoRef,
  CargaPedidoIbcSnapshot,
  ExpedicaoIbcRecord,
} from "../../../../../src/features/ibc/types/IbcExpedicao.types";

const FECHADO_POR_ID = "almox-1";
const CARGA_ID = "carga-1";
const COD_CAR = 202;

const buildCarga = (
  overrides: Partial<CargaExpedicaoRef> = {},
): CargaExpedicaoRef => ({
  id: CARGA_ID,
  codCar: COD_CAR,
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
  cargaId: CARGA_ID,
  numPed: "1120",
  alocadoPorId: FECHADO_POR_ID,
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
  | "fecharExpedicao"
>;

const buildHappyRepo = (overrides: Partial<RepoMock> = {}): RepoMock => {
  const alocacoes = [
    buildAlocacao({ id: "aloc-1", ibcId: "ibc-1", identificador: "H0045" }),
    buildAlocacao({ id: "aloc-2", ibcId: "ibc-2", identificador: "H0046" }),
    buildAlocacao({ id: "aloc-3", ibcId: "ibc-3", identificador: "H0047" }),
  ];
  const expedicao: ExpedicaoIbcRecord = {
    id: "exp-1",
    cargaId: CARGA_ID,
    fechadoPorId: FECHADO_POR_ID,
    fechadoEm: new Date("2026-08-24T15:00:00.000Z"),
  };

  return {
    getCargaByCodCar: mock.fn(async () => buildCarga()),
    listPedidosIbcByCargaId: mock.fn(async () => [buildPedidoIbc("1120")]),
    listAlocacoesByCargaId: mock.fn(async () => alocacoes),
    findExpedicaoByCargaId: mock.fn(async () => null),
    fecharExpedicao: mock.fn(async () => expedicao),
    ...overrides,
  };
};

const rejectsWithoutClosing = async (
  overrides: Partial<RepoMock>,
  assertError: (error: AppError) => void,
) => {
  const fecharExpedicao = mock.fn(async () => {
    throw new Error("não deve fechar");
  });
  const repo = buildHappyRepo({ ...overrides, fecharExpedicao });
  await assert.rejects(
    () =>
      new FecharExpedicaoIbcUseCase(repo as IIbcExpedicaoRepository).execute({
        codCar: COD_CAR,
        fechadoPorId: FECHADO_POR_ID,
      }),
    (error: unknown) => {
      assert.ok(error instanceof AppError);
      assertError(error);
      return true;
    },
  );
  assert.strictEqual(fecharExpedicao.mock.calls.length, 0);
};

describe("FecharExpedicaoIbcUseCase", () => {
  after(async () => {
    await new Promise((resolve) => setImmediate(resolve));
    await new Promise((resolve) => setTimeout(resolve, 50));
  });

  it("rejeita fechar expedição quando carga não está FECHADA", async () => {
    await rejectsWithoutClosing(
      { getCargaByCodCar: mock.fn(async () => buildCarga({ situacao: "ABERTA" })) },
      (error) => {
        assert.strictEqual(error.code, "IBC_CARGA_NAO_FECHADA");
        assert.strictEqual(error.statusCode, 409);
      },
    );
  });

  it("rejeita fechar expedição quando carga FECHADA não tem foto", async () => {
    await rejectsWithoutClosing(
      { listPedidosIbcByCargaId: mock.fn(async () => []) },
      (error) => {
        assert.strictEqual(error.code, "IBC_CARGA_SEM_FOTO_EXPEDICAO");
        assert.strictEqual(error.statusCode, 409);
      },
    );
  });

  it("rejeita fechar expedição quando a foto só tem Pedido IBC inválido", async () => {
    await rejectsWithoutClosing(
      {
        listPedidosIbcByCargaId: mock.fn(async () => [
          buildPedidoIbc("1121", { ibcInvalido: true, quantidadeEsperadaTotal: 0 }),
        ]),
        listAlocacoesByCargaId: mock.fn(async () => []),
      },
      (error) => assert.strictEqual(error.code, "IBC_EXPEDICAO_SEM_PEDIDOS"),
    );
  });

  it("rejeita fechar expedição quando pedido da foto está incompleto e nomeia o numPed", async () => {
    await rejectsWithoutClosing(
      {
        listAlocacoesByCargaId: mock.fn(async () => [
          buildAlocacao({ id: "aloc-1" }),
          buildAlocacao({ id: "aloc-2", ibcId: "ibc-2", identificador: "H0046" }),
        ]),
      },
      (error) => {
        assert.strictEqual(error.code, "IBC_EXPEDICAO_PEDIDO_INSUFICIENTE");
        assert.strictEqual(error.statusCode, 409);
        assert.ok(String(error.message).includes("1120"));
        const details = error.details as { numPed?: string };
        assert.strictEqual(details.numPed, "1120");
      },
    );
  });

  it("fecha expedição validando o total esperado da foto", async () => {
    const fecharExpedicao = mock.fn(
      async (data: {
        cargaId: string;
        fechadoPorId: string;
        alocacaoIds: string[];
        ibcIds: string[];
      }) => ({
        id: "exp-1",
        cargaId: data.cargaId,
        fechadoPorId: data.fechadoPorId,
        fechadoEm: new Date("2026-08-24T15:00:00.000Z"),
      }),
    );
    const repo = buildHappyRepo({ fecharExpedicao });

    const result = await new FecharExpedicaoIbcUseCase(
      repo as IIbcExpedicaoRepository,
    ).execute({ codCar: COD_CAR, fechadoPorId: FECHADO_POR_ID });

    assert.strictEqual(result.expedicao.id, "exp-1");
    assert.strictEqual(result.expedicao.cargaId, CARGA_ID);
    assert.strictEqual(result.ibcsEmViagem, 3);

    const call = fecharExpedicao.mock.calls[0]?.arguments[0] as {
      alocacaoIds: string[];
      ibcIds: string[];
    };
    assert.strictEqual(call.alocacaoIds.length, 3);
    assert.strictEqual(call.ibcIds.length, 3);
  });
});
