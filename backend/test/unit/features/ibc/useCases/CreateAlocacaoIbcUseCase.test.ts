import { describe, it, mock, after } from "node:test";
import assert from "node:assert/strict";
import { CreateAlocacaoIbcUseCase } from "../../../../../src/features/ibc/useCases/CreateAlocacaoIbc.use-case";
import { IIbcExpedicaoRepository } from "../../../../../src/features/ibc/repositories/IIbcExpedicaoRepository";
import { AppError } from "../../../../../src/utils/AppError";
import { PedidoCargo } from "../../../../../src/features/pedidos/types/PedidoCargo.types";
import {
  AlocacaoIbcRecord,
  CargaExpedicaoRef,
  IbcRecord,
} from "../../../../../src/features/ibc/types/IbcExpedicao.types";

const ALOCADO_POR_ID = "almox-1";
const CARGA_ID = "carga-1";
const COD_CAR = 101;

const buildCarga = (
  overrides: Partial<CargaExpedicaoRef> = {},
): CargaExpedicaoRef => ({
  id: CARGA_ID,
  codCar: COD_CAR,
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
    quantidadeEsperadaVenda: number;
    quantidadeEsperadaEmprestimo: number;
    ibcInvalido: boolean;
  }> = {},
): PedidoCargo =>
  new PedidoCargo({
    numPed,
    cliente: "Cliente Teste",
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

const buildIbc = (overrides: Partial<IbcRecord> = {}): IbcRecord => ({
  id: "ibc-1",
  identificador: "H0045",
  aptidao: "APTO",
  custodia: "PATIO",
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  ...overrides,
});

const buildAlocacao = (
  overrides: Partial<AlocacaoIbcRecord> = {},
): AlocacaoIbcRecord => ({
  id: "aloc-1",
  ibcId: "ibc-1",
  cargaId: CARGA_ID,
  numPed: "1120",
  alocadoPorId: ALOCADO_POR_ID,
  alocadoEm: new Date("2026-08-24T12:00:00.000Z"),
  expedicaoIbcId: null,
  identificador: "H0045",
  ...overrides,
});

type RepoMock = Pick<
  IIbcExpedicaoRepository,
  | "getCargaByCodCar"
  | "getPedidosByCarga"
  | "findIbcByIdentificador"
  | "findAlocacaoByIbcId"
  | "countAlocacoesByCargaAndNumPed"
  | "createAlocacao"
>;

const buildHappyRepo = (
  overrides: Partial<RepoMock> = {},
): RepoMock => {
  const ibc = buildIbc();
  const alocacao = buildAlocacao();
  return {
    getCargaByCodCar: mock.fn(async () => buildCarga()),
    getPedidosByCarga: mock.fn(async () => [buildPedido("1120")]),
    findIbcByIdentificador: mock.fn(async () => ibc),
    findAlocacaoByIbcId: mock.fn(async () => null),
    countAlocacoesByCargaAndNumPed: mock.fn(async () => 0),
    createAlocacao: mock.fn(async () => alocacao),
    ...overrides,
  };
};

describe("CreateAlocacaoIbcUseCase", () => {
  after(async () => {
    await new Promise((resolve) => setImmediate(resolve));
    await new Promise((resolve) => setTimeout(resolve, 50));
  });

  it("aloca IBC Apto no pátio a pedido elegível e retorna progresso 1 de 3", async () => {
    const repo = buildHappyRepo();
    const useCase = new CreateAlocacaoIbcUseCase(
      repo as IIbcExpedicaoRepository,
    );

    const result = await useCase.execute({
      codCar: COD_CAR,
      numPed: "1120",
      identificador: "H0045",
      alocadoPorId: ALOCADO_POR_ID,
    });

    assert.strictEqual(result.alocacao.identificador, "H0045");
    assert.strictEqual(result.alocacao.numPed, "1120");
    assert.strictEqual(result.quantidadeAlocada, 1);
    assert.strictEqual(result.quantidadeEsperadaTotal, 3);
    assert.strictEqual(
      (repo.createAlocacao as ReturnType<typeof mock.fn>).mock.calls.length,
      1,
    );
  });

  it("rejeita alocação quando IBC é Inapto", async () => {
    const createAlocacao = mock.fn(async () => {
      throw new Error("não deve criar");
    });
    const repo = buildHappyRepo({
      findIbcByIdentificador: mock.fn(async () =>
        buildIbc({ identificador: "H0099", aptidao: "INAPTO" }),
      ),
      createAlocacao,
    });
    const useCase = new CreateAlocacaoIbcUseCase(
      repo as IIbcExpedicaoRepository,
    );

    await assert.rejects(
      async () =>
        useCase.execute({
          codCar: COD_CAR,
          numPed: "1120",
          identificador: "H0099",
          alocadoPorId: ALOCADO_POR_ID,
        }),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.strictEqual(error.code, "IBC_INAPTO");
        assert.strictEqual(error.statusCode, 409);
        return true;
      },
    );
    assert.strictEqual(createAlocacao.mock.calls.length, 0);
  });

  it("rejeita alocação quando IBC já está Em viagem", async () => {
    const createAlocacao = mock.fn(async () => {
      throw new Error("não deve criar");
    });
    const repo = buildHappyRepo({
      findIbcByIdentificador: mock.fn(async () =>
        buildIbc({ identificador: "H0100", custodia: "EM_VIAGEM" }),
      ),
      createAlocacao,
    });
    const useCase = new CreateAlocacaoIbcUseCase(
      repo as IIbcExpedicaoRepository,
    );

    await assert.rejects(
      async () =>
        useCase.execute({
          codCar: COD_CAR,
          numPed: "1120",
          identificador: "H0100",
          alocadoPorId: ALOCADO_POR_ID,
        }),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.strictEqual(error.code, "IBC_EM_VIAGEM");
        return true;
      },
    );
    assert.strictEqual(createAlocacao.mock.calls.length, 0);
  });

  it("rejeita alocação quando IBC já está vinculado a outra carga", async () => {
    const createAlocacao = mock.fn(async () => {
      throw new Error("não deve criar");
    });
    const repo = buildHappyRepo({
      findAlocacaoByIbcId: mock.fn(async () =>
        buildAlocacao({
          cargaId: "carga-outra",
          identificador: "H0101",
          ibcId: "ibc-h0101",
        }),
      ),
      findIbcByIdentificador: mock.fn(async () =>
        buildIbc({ id: "ibc-h0101", identificador: "H0101" }),
      ),
      createAlocacao,
    });
    const useCase = new CreateAlocacaoIbcUseCase(
      repo as IIbcExpedicaoRepository,
    );

    await assert.rejects(
      async () =>
        useCase.execute({
          codCar: COD_CAR,
          numPed: "1120",
          identificador: "H0101",
          alocadoPorId: ALOCADO_POR_ID,
        }),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.strictEqual(error.code, "IBC_JA_ALOCADO");
        assert.match(error.message, /outra carga/);
        const details = error.details as { mesmaCarga?: boolean };
        assert.strictEqual(details.mesmaCarga, false);
        return true;
      },
    );
    assert.strictEqual(createAlocacao.mock.calls.length, 0);
  });

  it("rejeita alocação quando IBC já está vinculado nesta mesma carga", async () => {
    const createAlocacao = mock.fn(async () => {
      throw new Error("não deve criar");
    });
    const repo = buildHappyRepo({
      findAlocacaoByIbcId: mock.fn(async () =>
        buildAlocacao({
          cargaId: CARGA_ID,
          identificador: "H0102",
          ibcId: "ibc-h0102",
        }),
      ),
      findIbcByIdentificador: mock.fn(async () =>
        buildIbc({ id: "ibc-h0102", identificador: "H0102" }),
      ),
      createAlocacao,
    });
    const useCase = new CreateAlocacaoIbcUseCase(
      repo as IIbcExpedicaoRepository,
    );

    await assert.rejects(
      async () =>
        useCase.execute({
          codCar: COD_CAR,
          numPed: "1120",
          identificador: "H0102",
          alocadoPorId: ALOCADO_POR_ID,
        }),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.strictEqual(error.code, "IBC_JA_ALOCADO");
        assert.match(error.message, /nesta carga/);
        const details = error.details as { mesmaCarga?: boolean };
        assert.strictEqual(details.mesmaCarga, true);
        return true;
      },
    );
    assert.strictEqual(createAlocacao.mock.calls.length, 0);
  });

  it("rejeita alocação além da quantidadeEsperadaTotal (cap total, não split)", async () => {
    const createAlocacao = mock.fn(async () => {
      throw new Error("não deve criar");
    });
    const repo = buildHappyRepo({
      getPedidosByCarga: mock.fn(async () => [
        buildPedido("1120", {
          quantidadeEsperadaTotal: 3,
          quantidadeEsperadaVenda: 2,
          quantidadeEsperadaEmprestimo: 1,
        }),
      ]),
      countAlocacoesByCargaAndNumPed: mock.fn(async () => 3),
      createAlocacao,
    });
    const useCase = new CreateAlocacaoIbcUseCase(
      repo as IIbcExpedicaoRepository,
    );

    await assert.rejects(
      async () =>
        useCase.execute({
          codCar: COD_CAR,
          numPed: "1120",
          identificador: "H0045",
          alocadoPorId: ALOCADO_POR_ID,
        }),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.strictEqual(error.code, "IBC_QUANTIDADE_EXCEDIDA");
        assert.strictEqual(error.statusCode, 409);
        return true;
      },
    );
    assert.strictEqual(createAlocacao.mock.calls.length, 0);
  });

  it("rejeita alocação em Pedido IBC inválido", async () => {
    const createAlocacao = mock.fn(async () => {
      throw new Error("não deve criar");
    });
    const repo = buildHappyRepo({
      getPedidosByCarga: mock.fn(async () => [
        buildPedido("1120", {
          isContainer: false,
          ibcInvalido: true,
          quantidadeEsperadaTotal: 0,
        }),
      ]),
      createAlocacao,
    });
    const useCase = new CreateAlocacaoIbcUseCase(
      repo as IIbcExpedicaoRepository,
    );

    await assert.rejects(
      async () =>
        useCase.execute({
          codCar: COD_CAR,
          numPed: "1120",
          identificador: "H0045",
          alocadoPorId: ALOCADO_POR_ID,
        }),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.strictEqual(error.code, "IBC_PEDIDO_INVALIDO");
        return true;
      },
    );
    assert.strictEqual(createAlocacao.mock.calls.length, 0);
  });

  it("permite alocar em carga FECHADA", async () => {
    const repo = buildHappyRepo({
      getCargaByCodCar: mock.fn(async () => buildCarga({ situacao: "FECHADA" })),
    });
    const useCase = new CreateAlocacaoIbcUseCase(
      repo as IIbcExpedicaoRepository,
    );

    const result = await useCase.execute({
      codCar: COD_CAR,
      numPed: "1120",
      identificador: "H0045",
      alocadoPorId: ALOCADO_POR_ID,
    });

    assert.strictEqual(result.alocacao.numPed, "1120");
  });
});
