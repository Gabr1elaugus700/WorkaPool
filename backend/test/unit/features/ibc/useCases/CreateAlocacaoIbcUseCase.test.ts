import { describe, it, mock, after } from "node:test";
import assert from "node:assert/strict";
import { CreateAlocacaoIbcSchema } from "../../../../../src/features/ibc/http/schemas/CreateAlocacaoIbcSchema";
import { GruposConfiguradosLookup } from "../../../../../src/features/ibc/services/carregarCompatibilidadeDePedidos";
import { CreateAlocacaoIbcUseCase } from "../../../../../src/features/ibc/useCases/CreateAlocacaoIbc.use-case";
import { IIbcExpedicaoRepository } from "../../../../../src/features/ibc/repositories/IIbcExpedicaoRepository";
import { AppError } from "../../../../../src/utils/AppError";
import {
  AlocacaoIbcRecord,
  CargaExpedicaoRef,
  CargaPedidoIbcSnapshot,
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
  cliente: "Cliente Teste",
  quantidadeEsperadaTotal: 3,
  quantidadeEsperadaVenda: 3,
  quantidadeEsperadaEmprestimo: 0,
  ibcInvalido: false,
  posCar: null,
  gruposCodigo: [],
  ...overrides,
});

const buildIbc = (overrides: Partial<IbcRecord> = {}): IbcRecord => {
  const grupoCodigo = overrides.grupoCodigo ?? null;
  return {
    id: "ibc-1",
    identificador: "H0045",
    aptidao: "APTO",
    custodia: "PATIO",
    dataLimite: new Date("2099-12-31T00:00:00.000Z"),
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    convertedToContainerId: null,
    ...overrides,
    grupoCodigo,
    universal: overrides.universal ?? grupoCodigo == null,
  };
};

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
  | "listPedidosIbcByCargaId"
  | "findIbcByIdentificador"
  | "findAlocacaoByIbcId"
  | "listAlocacoesByCargaId"
  | "createAlocacao"
  | "markIbcDataLimite"
>;

const buildHappyRepo = (
  overrides: Partial<RepoMock> = {},
): RepoMock => {
  const ibc = buildIbc();
  const alocacao = buildAlocacao({ numPed: null });
  return {
    getCargaByCodCar: mock.fn(async () => buildCarga()),
    listPedidosIbcByCargaId: mock.fn(async () => [buildPedidoIbc("1120")]),
    findIbcByIdentificador: mock.fn(async () => ibc),
    findAlocacaoByIbcId: mock.fn(async () => null),
    listAlocacoesByCargaId: mock.fn(async () => []),
    createAlocacao: mock.fn(async () => alocacao),
    markIbcDataLimite: mock.fn(async () => ibc),
    ...overrides,
  };
};

const vincular = (identificador = "H0045") => ({
  codCar: COD_CAR,
  identificador,
  alocadoPorId: ALOCADO_POR_ID,
});

describe("CreateAlocacaoIbcUseCase", () => {
  after(async () => {
    await new Promise((resolve) => setImmediate(resolve));
    await new Promise((resolve) => setTimeout(resolve, 50));
  });

  it("vincula o container na carga sem pedir nem gravar pedido", async () => {
    const repo = buildHappyRepo();
    const useCase = new CreateAlocacaoIbcUseCase(
      repo as IIbcExpedicaoRepository,
    );

    const parsed = CreateAlocacaoIbcSchema.safeParse({
      codCar: COD_CAR,
      identificador: "H0045",
      numPed: "1120",
    });
    assert.equal(parsed.success, true);
    if (!parsed.success) return;
    assert.equal("numPed" in parsed.data, false);

    const result = await useCase.execute({
      ...parsed.data,
      alocadoPorId: ALOCADO_POR_ID,
    });

    assert.strictEqual(result.alocacao.identificador, "H0045");
    assert.strictEqual(result.alocacao.numPed, null);
    assert.strictEqual(result.quantidadeAlocada, 1);
    assert.strictEqual(result.quantidadeEsperadaTotal, 3);
    assert.deepEqual(result.avisos, []);
    const gravado = (
      repo.createAlocacao as ReturnType<typeof mock.fn>
    ).mock.calls[0]?.arguments[0] as { numPed: string | null };
    assert.strictEqual(gravado.numPed, null);
    assert.strictEqual(
      (repo.createAlocacao as ReturnType<typeof mock.fn>).mock.calls.length,
      1,
    );
  });

  it("aceita IBC recém-cadastrado (Apto, sem inspeção) com data limite futura", async () => {
    const markIbcDataLimite = mock.fn(async () => buildIbc());
    const repo = buildHappyRepo({
      findIbcByIdentificador: mock.fn(async () =>
        buildIbc({ identificador: "HMS00001", aptidao: "APTO" }),
      ),
      markIbcDataLimite,
    });
    const useCase = new CreateAlocacaoIbcUseCase(
      repo as IIbcExpedicaoRepository,
    );

    const result = await useCase.execute({
      codCar: COD_CAR,
      identificador: "HMS00001",
      alocadoPorId: ALOCADO_POR_ID,
    });

    assert.strictEqual(result.quantidadeAlocada, 1);
    assert.strictEqual(markIbcDataLimite.mock.calls.length, 0);
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

  it("rejeita IBC em custódia no cliente", async () => {
    const createAlocacao = mock.fn(async () => {
      throw new Error("não deve criar");
    });
    const repo = buildHappyRepo({
      findIbcByIdentificador: mock.fn(async () =>
        buildIbc({ identificador: "H0103", custodia: "CLIENTE" }),
      ),
      createAlocacao,
    });
    const useCase = new CreateAlocacaoIbcUseCase(repo as IIbcExpedicaoRepository);

    await assert.rejects(
      () =>
        useCase.execute({
          codCar: COD_CAR,
          identificador: "H0103",
          alocadoPorId: ALOCADO_POR_ID,
        }),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.strictEqual(error.code, "IBC_NO_CLIENTE");
        return true;
      },
    );
    assert.strictEqual(createAlocacao.mock.calls.length, 0);
  });

  it("rejeita IBC em entrada no pátio mesmo se a aptidão já foi para Apto", async () => {
    const createAlocacao = mock.fn(async () => {
      throw new Error("não deve criar");
    });
    const repo = buildHappyRepo({
      findIbcByIdentificador: mock.fn(async () =>
        buildIbc({ identificador: "H0102", custodia: "ENTRADA", aptidao: "APTO" }),
      ),
      createAlocacao,
    });
    const useCase = new CreateAlocacaoIbcUseCase(repo as IIbcExpedicaoRepository);

    await assert.rejects(
      () =>
        useCase.execute({
          codCar: COD_CAR,
          identificador: "H0102",
          alocadoPorId: ALOCADO_POR_ID,
        }),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.equal(error.code, "IBC_ENTRADA_PENDENTE");
        assert.equal(error.statusCode, 409);
        return true;
      },
    );
    assert.equal(createAlocacao.mock.calls.length, 0);
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

  it("recusa o sétimo container quando a soma elegível é 6", async () => {
    const createAlocacao = mock.fn(async () => {
      throw new Error("não deve criar");
    });
    const repo = buildHappyRepo({
      listPedidosIbcByCargaId: mock.fn(async () => [
        buildPedidoIbc("1120", {
          quantidadeEsperadaTotal: 4,
          quantidadeEsperadaVenda: 4,
          quantidadeEsperadaEmprestimo: 0,
        }),
        buildPedidoIbc("1121", {
          quantidadeEsperadaTotal: 2,
          quantidadeEsperadaVenda: 0,
          quantidadeEsperadaEmprestimo: 2,
        }),
        buildPedidoIbc("1122", {
          quantidadeEsperadaTotal: 10,
          quantidadeEsperadaVenda: 5,
          quantidadeEsperadaEmprestimo: 5,
        }),
      ]),
      listAlocacoesByCargaId: mock.fn(async () =>
        Array.from({ length: 6 }, (_, index) =>
          buildAlocacao({ id: `aloc-${index}`, ibcId: `ibc-${index}` }),
        ),
      ),
      createAlocacao,
    });

    await assert.rejects(
      () =>
        new CreateAlocacaoIbcUseCase(repo as IIbcExpedicaoRepository).execute(
          vincular(),
        ),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.strictEqual(error.code, "IBC_QUANTIDADE_EXCEDIDA");
        assert.strictEqual(error.statusCode, 409);
        const details = error.details as {
          quantidadeAlocada?: number;
          quantidadeEsperadaTotal?: number;
        };
        assert.strictEqual(details.quantidadeAlocada, 6);
        assert.strictEqual(details.quantidadeEsperadaTotal, 6);
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
      listPedidosIbcByCargaId: mock.fn(async () => [
        buildPedidoIbc("1120", {
          ibcInvalido: true,
          quantidadeEsperadaTotal: 0,
          quantidadeEsperadaVenda: 0,
          quantidadeEsperadaEmprestimo: 0,
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
          identificador: "H0045",
          alocadoPorId: ALOCADO_POR_ID,
        }),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.strictEqual(error.code, "IBC_EXPEDICAO_SEM_PEDIDOS");
        return true;
      },
    );
    assert.strictEqual(createAlocacao.mock.calls.length, 0);
  });

  const rejectsWithoutCreating = async (
    overrides: Partial<RepoMock>,
    expected: { code: string; statusCode: number },
  ) => {
    const createAlocacao = mock.fn(async () => {
      throw new Error("não deve criar");
    });
    const repo = buildHappyRepo({ ...overrides, createAlocacao });
    await assert.rejects(
      () =>
        new CreateAlocacaoIbcUseCase(repo as IIbcExpedicaoRepository).execute(
          vincular(),
        ),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.strictEqual(error.code, expected.code);
        assert.strictEqual(error.statusCode, expected.statusCode);
        return true;
      },
    );
    assert.strictEqual(createAlocacao.mock.calls.length, 0);
  };

  it("rejeita alocação em carga ABERTA", async () => {
    await rejectsWithoutCreating(
      { getCargaByCodCar: mock.fn(async () => buildCarga({ situacao: "ABERTA" })) },
      { code: "IBC_CARGA_NAO_FECHADA", statusCode: 409 },
    );
  });

  it("rejeita alocação em carga FECHADA sem foto", async () => {
    await rejectsWithoutCreating(
      { listPedidosIbcByCargaId: mock.fn(async () => []) },
      { code: "IBC_CARGA_SEM_FOTO_EXPEDICAO", statusCode: 409 },
    );
  });

  it("pedido misto não entra na soma e não impede vincular no teto dos demais", async () => {
    const repo = buildHappyRepo({
      listPedidosIbcByCargaId: mock.fn(async () => [
        buildPedidoIbc("1120", {
          quantidadeEsperadaTotal: 1,
          quantidadeEsperadaVenda: 1,
          quantidadeEsperadaEmprestimo: 0,
        }),
        buildPedidoIbc("9000", {
          quantidadeEsperadaTotal: 8,
          quantidadeEsperadaVenda: 4,
          quantidadeEsperadaEmprestimo: 4,
        }),
      ]),
    });

    const result = await new CreateAlocacaoIbcUseCase(
      repo as IIbcExpedicaoRepository,
    ).execute(vincular());

    assert.strictEqual(result.quantidadeEsperadaTotal, 1);
    assert.strictEqual(result.quantidadeAlocada, 1);
    assert.strictEqual(result.alocacao.numPed, null);
  });

  it("rejeita alocação de IBC substituído com 409 IBC_SUBSTITUIDO", async () => {
    const createAlocacao = mock.fn(async () => {
      throw new Error("não deve criar");
    });
    const markIbcDataLimite = mock.fn(async () => buildIbc());
    const repo = buildHappyRepo({
      findIbcByIdentificador: mock.fn(async () =>
        buildIbc({
          identificador: "HMS00007",
          convertedToContainerId: "ibc-destino",
          custodia: "EM_VIAGEM",
          dataLimite: new Date("2020-01-01T00:00:00.000Z"),
        }),
      ),
      createAlocacao,
      markIbcDataLimite,
    });
    const useCase = new CreateAlocacaoIbcUseCase(
      repo as IIbcExpedicaoRepository,
    );

    await assert.rejects(
      async () =>
        useCase.execute({
          codCar: COD_CAR,
          identificador: "HMS00007",
          alocadoPorId: ALOCADO_POR_ID,
        }),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.strictEqual(error.code, "IBC_SUBSTITUIDO");
        assert.strictEqual(error.statusCode, 409);
        const details = error.details as { convertedToContainerId?: string };
        assert.strictEqual(details.convertedToContainerId, "ibc-destino");
        return true;
      },
    );
    assert.strictEqual(createAlocacao.mock.calls.length, 0);
    assert.strictEqual(markIbcDataLimite.mock.calls.length, 0);
  });

  it("allocation gate materializes DATA_LIMITE before rejecting", async () => {
    const createAlocacao = mock.fn(async () => {
      throw new Error("não deve criar");
    });
    const markIbcDataLimite = mock.fn(async () =>
      buildIbc({
        identificador: "HM0010",
        aptidao: "INAPTO",
        dataLimite: new Date("2020-01-01T00:00:00.000Z"),
      }),
    );
    const repo = buildHappyRepo({
      findIbcByIdentificador: mock.fn(async () =>
        buildIbc({
          id: "ibc-due",
          identificador: "HM0010",
          aptidao: "APTO",
          custodia: "PATIO",
          dataLimite: new Date("2020-01-01T00:00:00.000Z"),
        }),
      ),
      markIbcDataLimite,
      createAlocacao,
    });
    const useCase = new CreateAlocacaoIbcUseCase(
      repo as IIbcExpedicaoRepository,
    );

    await assert.rejects(
      async () =>
        useCase.execute({
          codCar: COD_CAR,
          identificador: "HM0010",
          alocadoPorId: ALOCADO_POR_ID,
        }),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.strictEqual(error.code, "IBC_INAPTO");
        assert.strictEqual(error.statusCode, 409);
        const details = error.details as { motivoInaptidao?: string };
        assert.strictEqual(details.motivoInaptidao, "DATA_LIMITE");
        return true;
      },
    );
    assert.strictEqual(markIbcDataLimite.mock.calls.length, 1);
    assert.deepEqual(markIbcDataLimite.mock.calls[0].arguments, ["ibc-due"]);
    assert.strictEqual(createAlocacao.mock.calls.length, 0);
  });

  const gruposConfigurados = (
    configurados: readonly string[],
  ): GruposConfiguradosLookup => ({
    listGruposConfigurados: async () => configurados,
  });

  const alocar = (
    repo: RepoMock,
    identificador: string,
    configurados: readonly string[],
    ibc: Partial<IbcRecord>,
  ) => {
    const comIbc = buildHappyRepo({
      ...repo,
      findIbcByIdentificador: mock.fn(async () =>
        buildIbc({ identificador, ...ibc }),
      ),
    });
    return new CreateAlocacaoIbcUseCase(
      comIbc as IIbcExpedicaoRepository,
      gruposConfigurados(configurados),
    ).execute(vincular(identificador));
  };

  it("carga de soda recusa container de cloro", async () => {
    const createAlocacao = mock.fn(async () => {
      throw new Error("não deve criar");
    });
    const repo = buildHappyRepo({
      listPedidosIbcByCargaId: mock.fn(async () => [
        buildPedidoIbc("1120", { gruposCodigo: ["SODA"] }),
      ]),
      createAlocacao,
    });

    await assert.rejects(
      () =>
        alocar(repo, "NHC00001", ["SODA"], {
          universal: false,
          grupoCodigo: "CLORO",
        }),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.strictEqual(error.code, "IBC_PRODUTO_INCOMPATIVEL");
        assert.strictEqual(error.statusCode, 409);
        assert.deepEqual(error.details, {
          identificador: "NHC00001",
          grupoContainer: "CLORO",
          gruposPermitidos: ["SODA"],
        });
        return true;
      },
    );
    assert.strictEqual(createAlocacao.mock.calls.length, 0);
  });

  it("carga de soda aceita HM de soda, NH de soda e NH universal", async () => {
    const pedidos = [buildPedidoIbc("1120", { gruposCodigo: ["SODA"] })];
    const casos = [
      { identificador: "HMS00001", universal: false, grupoCodigo: "SODA" },
      { identificador: "NHS00001", universal: false, grupoCodigo: "SODA" },
      { identificador: "NH00001", universal: true, grupoCodigo: null },
    ];

    for (const caso of casos) {
      const createAlocacao = mock.fn(async () =>
        buildAlocacao({ identificador: caso.identificador, numPed: null }),
      );
      const repo = buildHappyRepo({
        listPedidosIbcByCargaId: mock.fn(async () => pedidos),
        createAlocacao,
      });
      const result = await alocar(repo, caso.identificador, ["SODA"], caso);
      assert.strictEqual(result.alocacao.identificador, caso.identificador);
      assert.strictEqual(createAlocacao.mock.calls.length, 1);
    }
  });

  it("carga com soda e ácido aceita container dos dois grupos", async () => {
    const pedidos = [
      buildPedidoIbc("1120", { gruposCodigo: ["SODA"] }),
      buildPedidoIbc("1121", {
        gruposCodigo: ["ACIDO"],
        quantidadeEsperadaTotal: 1,
        quantidadeEsperadaVenda: 1,
      }),
    ];
    for (const grupo of ["SODA", "ACIDO"]) {
      const createAlocacao = mock.fn(async () =>
        buildAlocacao({ identificador: `NH${grupo}00001`, numPed: null }),
      );
      const repo = buildHappyRepo({
        listPedidosIbcByCargaId: mock.fn(async () => pedidos),
        createAlocacao,
      });
      const result = await alocar(repo, `NH${grupo}00001`, ["SODA", "ACIDO"], {
        universal: false,
        grupoCodigo: grupo,
      });
      assert.strictEqual(result.quantidadeAlocada, 1);
      assert.deepEqual(result.avisos, []);
    }
  });

  it("legado sem produto é recusado na saída", async () => {
    const createAlocacao = mock.fn(async () => {
      throw new Error("não deve criar");
    });
    const repo = buildHappyRepo({
      listPedidosIbcByCargaId: mock.fn(async () => [
        buildPedidoIbc("1120", { gruposCodigo: ["SODA"] }),
      ]),
      createAlocacao,
    });

    await assert.rejects(
      () => alocar(repo, "HM0007", ["SODA"], { universal: false, grupoCodigo: null }),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.strictEqual(error.code, "IBC_PRODUTO_INCOMPATIVEL");
        assert.deepEqual(error.details, {
          identificador: "HM0007",
          grupoContainer: null,
          gruposPermitidos: ["SODA"],
        });
        return true;
      },
    );
    assert.strictEqual(createAlocacao.mock.calls.length, 0);
  });

  it("pedido com grupo sem configuração só aceita universal e devolve aviso", async () => {
    const pedidos = [
      buildPedidoIbc("1120", { gruposCodigo: ["SODA"] }),
      buildPedidoIbc("1121", {
        gruposCodigo: ["SEM"],
        quantidadeEsperadaTotal: 1,
        quantidadeEsperadaVenda: 1,
      }),
      buildPedidoIbc("9000", {
        gruposCodigo: ["CLORO"],
        quantidadeEsperadaTotal: 4,
        quantidadeEsperadaVenda: 2,
        quantidadeEsperadaEmprestimo: 2,
      }),
    ];
    const aviso = {
      code: "IBC_PEDIDO_GRUPO_SEM_CONFIG",
      numPed: "1121",
      gruposCodigo: ["SEM"],
      message:
        "Pedido 1121: grupo SEM não tem configuração de placa. Só o container universal atende.",
    };

    const universal = await alocar(
      buildHappyRepo({
        listPedidosIbcByCargaId: mock.fn(async () => pedidos),
      }),
      "NH00001",
      ["SODA"],
      { universal: true, grupoCodigo: null },
    );
    assert.deepEqual(universal.avisos, [aviso]);

    const soda = await alocar(
      buildHappyRepo({
        listPedidosIbcByCargaId: mock.fn(async () => pedidos),
      }),
      "HMS00001",
      ["SODA"],
      { universal: false, grupoCodigo: "SODA" },
    );
    assert.deepEqual(soda.avisos, [aviso]);

    const createAlocacao = mock.fn(async () => {
      throw new Error("não deve criar");
    });
    await assert.rejects(
      () =>
        alocar(
          buildHappyRepo({
            listPedidosIbcByCargaId: mock.fn(async () => pedidos),
            createAlocacao,
          }),
          "NHSEM0001",
          ["SODA"],
          { universal: false, grupoCodigo: "SEM" },
        ),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.strictEqual(error.code, "IBC_PRODUTO_INCOMPATIVEL");
        assert.deepEqual(error.details, {
          identificador: "NHSEM0001",
          grupoContainer: "SEM",
          gruposPermitidos: ["SODA"],
        });
        return true;
      },
    );
    assert.strictEqual(createAlocacao.mock.calls.length, 0);
  });
});
