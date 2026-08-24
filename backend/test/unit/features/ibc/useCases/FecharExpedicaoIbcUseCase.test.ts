import { describe, it, mock, after } from "node:test";
import assert from "node:assert/strict";
import { FecharExpedicaoIbcUseCase } from "../../../../../src/features/ibc/useCases/FecharExpedicaoIbc.use-case";
import { IIbcExpedicaoRepository } from "../../../../../src/features/ibc/repositories/IIbcExpedicaoRepository";
import { AppError } from "../../../../../src/utils/AppError";
import { PedidoCargo } from "../../../../../src/features/pedidos/types/PedidoCargo.types";
import {
  AlocacaoIbcRecord,
  CargaExpedicaoRef,
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

const buildPedido = (
  numPed: string,
  overrides: Partial<{
    isContainer: boolean;
    quantidadeEsperadaTotal: number;
    quantidadeEsperadaVenda: number;
    quantidadeEsperadaEmprestimo: number;
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
    quantidadeEsperadaVenda: overrides.quantidadeEsperadaVenda ?? 2,
    quantidadeEsperadaEmprestimo: overrides.quantidadeEsperadaEmprestimo ?? 1,
    ibcInvalido: overrides.ibcInvalido ?? false,
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
  | "getPedidosByCarga"
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
    getPedidosByCarga: mock.fn(async () => [
      buildPedido("1120", {
        quantidadeEsperadaTotal: 3,
        quantidadeEsperadaVenda: 2,
        quantidadeEsperadaEmprestimo: 1,
      }),
    ]),
    listAlocacoesByCargaId: mock.fn(async () => alocacoes),
    findExpedicaoByCargaId: mock.fn(async () => null),
    fecharExpedicao: mock.fn(async () => expedicao),
    ...overrides,
  };
};

describe("FecharExpedicaoIbcUseCase", () => {
  after(async () => {
    await new Promise((resolve) => setImmediate(resolve));
    await new Promise((resolve) => setTimeout(resolve, 50));
  });

  it("rejeita fechar expedição quando carga não está FECHADA", async () => {
    const fecharExpedicao = mock.fn(async () => {
      throw new Error("não deve fechar");
    });
    const repo = buildHappyRepo({
      getCargaByCodCar: mock.fn(async () => buildCarga({ situacao: "ABERTA" })),
      fecharExpedicao,
    });
    const useCase = new FecharExpedicaoIbcUseCase(
      repo as IIbcExpedicaoRepository,
    );

    await assert.rejects(
      async () =>
        useCase.execute({ codCar: COD_CAR, fechadoPorId: FECHADO_POR_ID }),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.strictEqual(error.code, "IBC_EXPEDICAO_CARGA_NAO_FECHADA");
        assert.strictEqual(error.statusCode, 409);
        return true;
      },
    );
    assert.strictEqual(fecharExpedicao.mock.calls.length, 0);
  });

  it("rejeita fechar expedição quando pedido IBC está incompleto e nomeia o numPed", async () => {
    const fecharExpedicao = mock.fn(async () => {
      throw new Error("não deve fechar");
    });
    const repo = buildHappyRepo({
      listAlocacoesByCargaId: mock.fn(async () => [
        buildAlocacao({ id: "aloc-1" }),
        buildAlocacao({ id: "aloc-2", ibcId: "ibc-2", identificador: "H0046" }),
      ]),
      fecharExpedicao,
    });
    const useCase = new FecharExpedicaoIbcUseCase(
      repo as IIbcExpedicaoRepository,
    );

    await assert.rejects(
      async () =>
        useCase.execute({ codCar: COD_CAR, fechadoPorId: FECHADO_POR_ID }),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.strictEqual(error.code, "IBC_EXPEDICAO_PEDIDO_INSUFICIENTE");
        assert.strictEqual(error.statusCode, 409);
        assert.ok(
          String(error.message).includes("1120"),
          "mensagem deve nomear o pedido",
        );
        const details = error.details as { numPed?: string };
        assert.strictEqual(details.numPed, "1120");
        return true;
      },
    );
    assert.strictEqual(fecharExpedicao.mock.calls.length, 0);
  });

  it("fecha expedição usando total esperado (não split Venda/Empréstimo)", async () => {
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
    const useCase = new FecharExpedicaoIbcUseCase(
      repo as IIbcExpedicaoRepository,
    );

    const result = await useCase.execute({
      codCar: COD_CAR,
      fechadoPorId: FECHADO_POR_ID,
    });

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
