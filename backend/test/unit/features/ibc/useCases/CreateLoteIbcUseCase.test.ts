import { describe, it, mock } from "node:test";
import assert from "node:assert/strict";
import { CreateLoteIbcUseCase } from "../../../../../src/features/ibc/useCases/CreateLoteIbc.use-case";
import { IIbcCadastroRepository } from "../../../../../src/features/ibc/repositories/IIbcCadastroRepository";
import { IbcProdutoConfigRecord } from "../../../../../src/features/ibc/repositories/IbcProdutoRepository";
import {
  CatalogoCadastroLookup,
  ProdutoCadastroLookup,
} from "../../../../../src/features/ibc/services/resolverProdutoCadastroIbc";
import { ISaldoIbcErp } from "../../../../../src/features/ibc/ports/ISaldoIbcErp";
import {
  CreateIbcLoteData,
  CreateNovoIbcData,
  IbcCadastroRecord,
  IbcLoteRecord,
} from "../../../../../src/features/ibc/types/IbcCadastro.types";
import { AppError } from "../../../../../src/utils/AppError";
import { FakeSaldoIbcErp } from "../../../../../src/features/ibc/adapters/FakeSaldoIbcErp";
import { formatIbcIdentifier } from "../../../../../src/features/ibc/services/formatIbcIdentifier";

const FUTURE_DATA_LIMITE = new Date("2099-12-31T00:00:00.000Z");
const PAST_DATA_LIMITE = new Date("2020-01-01T00:00:00.000Z");

type RepoMock = Pick<
  IIbcCadastroRepository,
  | "createNovoIbcs"
  | "countVivosWp"
  | "createIbcLote"
>;
const buildLote = (data: CreateIbcLoteData): IbcLoteRecord => ({
  id: "lote-1",
  numeroNf: data.numeroNf,
  dataLimite: data.dataLimite,
  createdAt: new Date("2026-09-14T12:00:00.000Z"),
});

const buildCreatedIbc = (
  data: CreateNovoIbcData,
  sequencial: number,
): IbcCadastroRecord => ({
  id: `ibc-${data.prefixo}-${sequencial}`,
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
  createdAt: new Date("2026-09-14T12:00:00.000Z"),
  loteId: data.loteId ?? null,
});

const createNovoIbcsFrom = (firstSequencial: number) =>
  mock.fn(async (data: CreateNovoIbcData, quantidade: number) =>
    Array.from({ length: quantidade }, (_, index) =>
      buildCreatedIbc(data, firstSequencial + index),
    ),
  );

const buildRepo = (overrides: Partial<RepoMock> = {}): RepoMock => ({
  createNovoIbcs: createNovoIbcsFrom(10),
  countVivosWp: mock.fn(async () => 0),
  createIbcLote: mock.fn(async (data: CreateIbcLoteData) => buildLote(data)),
  ...overrides,
});
const soda: IbcProdutoConfigRecord = {
  id: "produto-1",
  grupoCodigo: "01",
  sigla: "S",
  corHex: "#AA0000",
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

function buildUseCase(repo: RepoMock, saldo: ISaldoIbcErp | null = null, deps = lookups()) {
  return new CreateLoteIbcUseCase(
    repo as IIbcCadastroRepository,
    deps.produtos,
    deps.catalogo,
    saldo,
  );
}

const hm = { homologado: true, grupoCodigo: "01" } as const;

describe("CreateLoteIbcUseCase core (#117 / #121 slice 2)", () => {
  it("batch creates N IBCs with shared dataLimite and COMPRA defaults", async () => {
    const createNovoIbcs = createNovoIbcsFrom(10);
    const repo = buildRepo({ createNovoIbcs });
    const useCase = buildUseCase(repo);

    const result = await useCase.execute({
      quantidade: 3,
      dataLimite: FUTURE_DATA_LIMITE,
      ...hm,
    });

    assert.equal(result.items.length, 3);
    assert.equal(result.lote.id, "lote-1");
    for (const item of result.items) {
      assert.equal(item.tipoCadastro, "NOVO");
      assert.equal(item.aptidao, "APTO");
      assert.equal(item.motivoInaptidao, null);
      assert.equal(item.primeiraInspecaoEm, null);
      assert.equal(item.custodia, "PATIO");
      assert.equal(item.dataLimite?.toISOString(), FUTURE_DATA_LIMITE.toISOString());
      assert.equal(item.loteId, "lote-1");
      assert.equal(item.produtoId, "produto-1");
    }
    assert.equal(createNovoIbcs.mock.callCount(), 1);
    const [data, quantidade] = createNovoIbcs.mock.calls[0].arguments;
    assert.equal(data.prefixo, "HMS");
    assert.equal(quantidade, 3);
  });

  it("batch assigns sequential unique HM+product identifiers", async () => {
    const repo = buildRepo();
    const useCase = buildUseCase(repo);

    const result = await useCase.execute({
      quantidade: 3,
      dataLimite: FUTURE_DATA_LIMITE,
      ...hm,
    });

    assert.deepEqual(
      result.items.map((i) => i.identificador),
      ["HMS00010", "HMS00011", "HMS00012"],
    );
  });

  it("batch rejects past dataLimite like unit create", async () => {
    const createNovoIbcs = createNovoIbcsFrom(1);
    const createIbcLote = mock.fn(async (data: CreateIbcLoteData) =>
      buildLote(data),
    );
    const repo = buildRepo({ createNovoIbcs, createIbcLote });
    const useCase = buildUseCase(repo);

    await assert.rejects(
      () =>
        useCase.execute({
          quantidade: 2,
          dataLimite: PAST_DATA_LIMITE,
          ...hm,
        }),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.equal(error.code, "IBC_DATA_LIMITE_INVALIDA");
        return true;
      },
    );
    assert.equal(createNovoIbcs.mock.callCount(), 0);
    assert.equal(createIbcLote.mock.callCount(), 0);
  });

  it("rejects invalid N", async () => {
    const createNovoIbcs = createNovoIbcsFrom(1);
    const repo = buildRepo({ createNovoIbcs });
    const useCase = buildUseCase(repo);

    for (const quantidade of [0, -1, 201]) {
      await assert.rejects(
        () =>
          useCase.execute({
            quantidade,
            dataLimite: FUTURE_DATA_LIMITE,
            ...hm,
          }),
        (error: unknown) => {
          assert.ok(error instanceof AppError);
          assert.equal(error.code, "IBC_LOTE_QUANTIDADE_INVALIDA");
          return true;
        },
      );
    }
    assert.equal(createNovoIbcs.mock.callCount(), 0);
  });
});

describe("CreateLoteIbcUseCase soft ERP warning (#117 / #121 slice 3)", () => {
  it("soft warning when vivos plus N exceeds ERP saldo", async () => {
    const repo = buildRepo({
      countVivosWp: mock.fn(async () => 10),
    });
    const saldo = new FakeSaldoIbcErp({ status: "available", quantity: 12 });
    const useCase = buildUseCase(repo, saldo);

    const result = await useCase.execute({
      quantidade: 5,
      dataLimite: FUTURE_DATA_LIMITE,
      ...hm,
    });

    assert.equal(result.items.length, 5);
    assert.deepEqual(result.warning, {
      code: "OVER_SALDO",
      vivos: 10,
      quantidade: 5,
      saldo: 12,
    });
  });

  it("no warning when vivos plus N is within ERP saldo", async () => {
    const repo = buildRepo({
      countVivosWp: mock.fn(async () => 10),
    });
    const saldo = new FakeSaldoIbcErp({ status: "available", quantity: 20 });
    const useCase = buildUseCase(repo, saldo);

    const result = await useCase.execute({
      quantidade: 5,
      dataLimite: FUTURE_DATA_LIMITE,
      ...hm,
    });

    assert.equal(result.items.length, 5);
    assert.equal(result.warning, undefined);
  });

  it("ERP saldo unavailable still allows lote", async () => {
    const repo = buildRepo({
      countVivosWp: mock.fn(async () => 3),
    });
    const saldo = new FakeSaldoIbcErp({ status: "unavailable" });
    const useCase = buildUseCase(repo, saldo);

    const result = await useCase.execute({
      quantidade: 2,
      dataLimite: FUTURE_DATA_LIMITE,
      ...hm,
    });

    assert.equal(result.items.length, 2);
    assert.deepEqual(result.warning, {
      code: "SALDO_UNAVAILABLE",
      vivos: 3,
      quantidade: 2,
    });
  });
});

describe("CreateLoteIbcUseCase NF optional (#117 / #121 slice 4)", () => {
  it("stores optional NF number on the lote and links IBCs", async () => {
    const repo = buildRepo();
    const useCase = buildUseCase(repo);

    const result = await useCase.execute({
      quantidade: 2,
      dataLimite: FUTURE_DATA_LIMITE,
      numeroNf: "123456",
      ...hm,
    });

    assert.equal(result.lote.numeroNf, "123456");
    assert.ok(result.items.every((item) => item.loteId === result.lote.id));
  });

  it("allows lote without NF", async () => {
    const repo = buildRepo();
    const useCase = buildUseCase(repo);

    const result = await useCase.execute({
      quantidade: 2,
      dataLimite: FUTURE_DATA_LIMITE,
      ...hm,
    });

    assert.equal(result.lote.numeroNf, null);
    assert.equal(result.items.length, 2);
  });

  it("rejects a group without configuration", async () => {
    const createNovoIbcs = createNovoIbcsFrom(1);
    const createIbcLote = mock.fn(async (data: CreateIbcLoteData) => buildLote(data));
    const repo = buildRepo({ createNovoIbcs, createIbcLote });
    const useCase = buildUseCase(repo, null, lookups({ grupo: null }));

    await assert.rejects(
      () =>
        useCase.execute({
          quantidade: 2,
          dataLimite: FUTURE_DATA_LIMITE,
          homologado: true,
          grupoCodigo: "99",
        }),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, 422);
        assert.equal(error.code, "IBC_PRODUTO_NAO_CONFIGURADO");
        return true;
      },
    );
    assert.equal(createNovoIbcs.mock.callCount(), 0);
    assert.equal(createIbcLote.mock.callCount(), 0);
  });

  it("lote gera sequenciais consecutivos do prefixo NH+sigla e do NH universal", async () => {
    const ultimo = new Map<string, number>();
    const createNovoIbcs = mock.fn(async (data: CreateNovoIbcData, quantidade: number) => {
      const first = (ultimo.get(data.prefixo) ?? 0) + 1;
      ultimo.set(data.prefixo, first + quantidade - 1);
      return Array.from({ length: quantidade }, (_, index) => buildCreatedIbc(data, first + index));
    });
    const repo = buildRepo({ createNovoIbcs });
    const useCase = buildUseCase(repo);

    const comGrupo = await useCase.execute({
      quantidade: 3,
      dataLimite: FUTURE_DATA_LIMITE,
      homologado: false,
      grupoCodigo: "01",
    });
    const semGrupo = await useCase.execute({
      quantidade: 2,
      dataLimite: FUTURE_DATA_LIMITE,
      homologado: false,
    });

    assert.deepEqual(
      comGrupo.items.map((item) => item.identificador),
      ["NHS00001", "NHS00002", "NHS00003"],
    );
    assert.equal(comGrupo.items[0]?.corHex, "#AA0000");
    assert.equal(comGrupo.items[0]?.homologado, false);
    assert.equal(comGrupo.items[0]?.universal, false);
    assert.deepEqual(
      semGrupo.items.map((item) => item.identificador),
      ["NH00001", "NH00002"],
    );
    assert.equal(semGrupo.items[0]?.universal, true);
    assert.equal(semGrupo.items[0]?.produtoId, "universal-1");
  });

  it("HM sem grupo não abre lote", async () => {
    const createNovoIbcs = createNovoIbcsFrom(1);
    const createIbcLote = mock.fn(async (data: CreateIbcLoteData) => buildLote(data));
    const useCase = buildUseCase(buildRepo({ createNovoIbcs, createIbcLote }));
    await assert.rejects(
      () => useCase.execute({ quantidade: 2, dataLimite: FUTURE_DATA_LIMITE, homologado: true }),
      (error: unknown) => error instanceof AppError && error.code === "IBC_PRODUTO_OBRIGATORIO",
    );
    assert.equal(createIbcLote.mock.callCount(), 0);
    assert.equal(createNovoIbcs.mock.callCount(), 0);
  });
});
