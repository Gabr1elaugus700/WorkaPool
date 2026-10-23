import { describe, it, mock } from "node:test";
import assert from "node:assert/strict";
import { CreateNovoIbcUseCase } from "../../../../../src/features/ibc/useCases/CreateNovoIbc.use-case";
import { IIbcCadastroRepository } from "../../../../../src/features/ibc/repositories/IIbcCadastroRepository";
import { IbcProdutoConfigRecord } from "../../../../../src/features/ibc/repositories/IbcProdutoRepository";
import {
  CatalogoCadastroLookup,
  ProdutoCadastroLookup,
} from "../../../../../src/features/ibc/services/resolverProdutoCadastroIbc";
import {
  CreateNovoIbcData,
  IbcCadastroRecord,
} from "../../../../../src/features/ibc/types/IbcCadastro.types";
import { formatIbcIdentifier } from "../../../../../src/features/ibc/services/formatIbcIdentifier";
import { AppError } from "../../../../../src/utils/AppError";

const FUTURE_DATA_LIMITE = new Date("2099-12-31T00:00:00.000Z");
const PAST_DATA_LIMITE = new Date("2020-01-01T00:00:00.000Z");

const soda: IbcProdutoConfigRecord = {
  id: "produto-S",
  grupoCodigo: "01",
  sigla: "S",
  corHex: "#AA0000",
  universal: false,
  emUso: false,
};
const sodaLonga: IbcProdutoConfigRecord = {
  id: "produto-SO",
  grupoCodigo: "02",
  sigla: "SO",
  corHex: "#00AA00",
  universal: false,
  emUso: false,
};
const universal: IbcProdutoConfigRecord = {
  id: "universal-1",
  grupoCodigo: null,
  sigla: null,
  corHex: "#FFFFFF",
  universal: true,
  emUso: false,
};

type RepoMock = Pick<IIbcCadastroRepository, "createNovoIbcs">;

const buildCreatedIbc = (data: CreateNovoIbcData, sequencial: number): IbcCadastroRecord => ({
  id: "ibc-new-1",
  identificador: formatIbcIdentifier(data.prefixo, sequencial),
  prefixo: data.prefixo,
  sequencial,
  tipoCadastro: data.tipoCadastro,
  aptidao: data.aptidao,
  motivoInaptidao: data.motivoInaptidao,
  custodia: data.custodia,
  dataLimite: data.dataLimite,
  primeiraInspecaoEm: data.primeiraInspecaoEm,
  produtoId: data.produtoId,
  baixadoEm: null,
  createdAt: new Date("2026-09-08T12:00:00.000Z"),
});

const createNovoIbcsFrom = (firstSequencial: number) =>
  mock.fn(async (data: CreateNovoIbcData, quantidade: number) =>
    Array.from({ length: quantidade }, (_, index) => buildCreatedIbc(data, firstSequencial + index)),
  );

function porPrefixo() {
  const ultimo = new Map<string, number>();
  return mock.fn(async (data: CreateNovoIbcData, quantidade: number) => {
    const first = (ultimo.get(data.prefixo) ?? 0) + 1;
    ultimo.set(data.prefixo, first + quantidade - 1);
    return Array.from({ length: quantidade }, (_, index) => buildCreatedIbc(data, first + index));
  });
}

function lookups(options: {
  grupo?: IbcProdutoConfigRecord | null;
  universal?: IbcProdutoConfigRecord | null;
  noCatalogo?: boolean;
} = {}): { produtos: ProdutoCadastroLookup; catalogo: CatalogoCadastroLookup } {
  return {
    produtos: {
      findByGrupoCodigo: mock.fn(async () => (options.grupo === undefined ? soda : options.grupo)),
      findUniversal: mock.fn(async () => (options.universal === undefined ? universal : options.universal)),
    },
    catalogo: { hasGrupo: mock.fn(async () => options.noCatalogo !== true) },
  };
}

function buildUseCase(repo: RepoMock, deps = lookups()) {
  return new CreateNovoIbcUseCase(
    repo as IIbcCadastroRepository,
    deps.produtos,
    deps.catalogo,
  );
}

const codigoDe = async (run: () => Promise<unknown>) => {
  try {
    await run();
  } catch (error: unknown) {
    assert.ok(error instanceof AppError);
    return error;
  }
  assert.fail("esperava erro");
};

describe("CreateNovoIbcUseCase", () => {
  it("creating a Novo IBC starts Apto and sem inspeção", async () => {
    const repo: RepoMock = { createNovoIbcs: createNovoIbcsFrom(8) };
    const result = await buildUseCase(repo).execute({
      dataLimite: FUTURE_DATA_LIMITE,
      homologado: true,
      grupoCodigo: "01",
    });

    assert.equal(result.tipoCadastro, "NOVO");
    assert.equal(result.aptidao, "APTO");
    assert.equal(result.motivoInaptidao, null);
    assert.equal(result.primeiraInspecaoEm, null);
    assert.equal(result.custodia, "PATIO");
    assert.equal(result.identificador, "HMS00008");
    assert.equal(result.dataLimite?.toISOString(), FUTURE_DATA_LIMITE.toISOString());
    assert.equal(result.produtoId, "produto-S");
    assert.equal(result.corHex, "#AA0000");
    assert.equal(result.universal, false);
    assert.equal(result.homologado, true);
  });

  it("allocates exactly one IBC under the HM + sigla prefix", async () => {
    const createNovoIbcs = createNovoIbcsFrom(1);
    await buildUseCase({ createNovoIbcs }, lookups({ grupo: sodaLonga })).execute({
      dataLimite: FUTURE_DATA_LIMITE,
      homologado: true,
      grupoCodigo: "02",
    });

    const [data, quantidade] = createNovoIbcs.mock.calls[0].arguments;
    assert.equal(data.prefixo, "HMSO");
    assert.equal(quantidade, 1);
  });

  it("create rejects a past data limite", async () => {
    const createNovoIbcs = createNovoIbcsFrom(1);
    const error = await codigoDe(() =>
      buildUseCase({ createNovoIbcs }).execute({
        dataLimite: PAST_DATA_LIMITE,
        homologado: true,
        grupoCodigo: "01",
      }),
    );
    assert.equal(error.statusCode, 400);
    assert.equal(error.code, "IBC_DATA_LIMITE_INVALIDA");
    assert.equal(createNovoIbcs.mock.callCount(), 0);
  });

  it("HM sem grupo é recusado", async () => {
    const createNovoIbcs = createNovoIbcsFrom(1);
    const error = await codigoDe(() =>
      buildUseCase({ createNovoIbcs }).execute({
        dataLimite: FUTURE_DATA_LIMITE,
        homologado: true,
      }),
    );
    assert.equal(error.statusCode, 422);
    assert.equal(error.code, "IBC_PRODUTO_OBRIGATORIO");
    assert.equal(createNovoIbcs.mock.callCount(), 0);
  });

  it("NH sem grupo vira universal NH00001", async () => {
    const createNovoIbcs = createNovoIbcsFrom(1);
    const result = await buildUseCase({ createNovoIbcs }).execute({
      dataLimite: FUTURE_DATA_LIMITE,
      homologado: false,
    });

    const [data, quantidade] = createNovoIbcs.mock.calls[0].arguments;
    assert.equal(data.prefixo, "NH");
    assert.equal(data.produtoId, "universal-1");
    assert.equal(quantidade, 1);
    assert.equal(result.identificador, "NH00001");
    assert.equal(result.universal, true);
    assert.equal(result.homologado, false);
    assert.equal(result.corHex, "#FFFFFF");
  });

  it("NHS e NH têm sequências separadas", async () => {
    const createNovoIbcs = porPrefixo();
    const useCase = buildUseCase({ createNovoIbcs });
    const nhs = await useCase.execute({
      dataLimite: FUTURE_DATA_LIMITE,
      homologado: false,
      grupoCodigo: "01",
    });
    const nh = await useCase.execute({
      dataLimite: FUTURE_DATA_LIMITE,
      homologado: false,
      grupoCodigo: null,
    });
    const nhsDeNovo = await useCase.execute({
      dataLimite: FUTURE_DATA_LIMITE,
      homologado: false,
      grupoCodigo: " 01 ",
    });

    assert.equal(nhs.identificador, "NHS00001");
    assert.equal(nh.identificador, "NH00001");
    assert.equal(nhsDeNovo.identificador, "NHS00002");
    assert.deepEqual(
      createNovoIbcs.mock.calls.map((call) => call.arguments[0].prefixo),
      ["NHS", "NH", "NHS"],
    );
  });

  it("grupo sem sigla ou cor, ou fora do catálogo, é recusado", async () => {
    const semConfig = lookups({ grupo: null });
    const fora = lookups({ noCatalogo: true });
    const semSigla = lookups({
      grupo: { ...soda, sigla: null, corHex: "#AA0000" },
    });
    for (const deps of [semConfig, fora, semSigla]) {
      const createNovoIbcs = createNovoIbcsFrom(1);
      const error = await codigoDe(() =>
        buildUseCase({ createNovoIbcs }, deps).execute({
          dataLimite: FUTURE_DATA_LIMITE,
          homologado: true,
          grupoCodigo: "01",
        }),
      );
      assert.equal(error.statusCode, 422);
      assert.equal(error.code, "IBC_PRODUTO_NAO_CONFIGURADO");
      assert.equal(createNovoIbcs.mock.callCount(), 0);
    }
  });

  it("universal sem configuração é recusado", async () => {
    const createNovoIbcs = createNovoIbcsFrom(1);
    const error = await codigoDe(() =>
      buildUseCase({ createNovoIbcs }, lookups({ universal: null })).execute({
        dataLimite: FUTURE_DATA_LIMITE,
        homologado: false,
      }),
    );
    assert.equal(error.statusCode, 422);
    assert.equal(error.code, "IBC_PRODUTO_NAO_CONFIGURADO");
    assert.equal(createNovoIbcs.mock.callCount(), 0);
  });
});
