import { describe, it, mock } from "node:test";
import assert from "node:assert/strict";
import { CreateLoteIbcUseCase } from "../../../../../src/features/ibc/useCases/CreateLoteIbc.use-case";
import { IIbcCadastroRepository } from "../../../../../src/features/ibc/repositories/IIbcCadastroRepository";
import {
  CreateIbcLoteData,
  CreateNovoIbcData,
  IbcCadastroRecord,
  IbcLoteRecord,
} from "../../../../../src/features/ibc/types/IbcCadastro.types";
import { AppError } from "../../../../../src/utils/AppError";
import { FakeSaldoIbcErp } from "../../../../../src/features/ibc/adapters/FakeSaldoIbcErp";

const FUTURE_DATA_LIMITE = new Date("2099-12-31T00:00:00.000Z");
const PAST_DATA_LIMITE = new Date("2020-01-01T00:00:00.000Z");

type RepoMock = Pick<
  IIbcCadastroRepository,
  | "findHighestIdentificador"
  | "createNovoIbc"
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
  overrides: Partial<IbcCadastroRecord> = {},
): IbcCadastroRecord => ({
  id: `ibc-${data.identificador}`,
  identificador: data.identificador,
  tipoCadastro: data.tipoCadastro,
  aptidao: data.aptidao,
  motivoInaptidao: data.motivoInaptidao,
  custodia: data.custodia,
  dataLimite: data.dataLimite,
  baixadoEm: null,
  createdAt: new Date("2026-09-14T12:00:00.000Z"),
  loteId: data.loteId ?? null,
  ...overrides,
});

const buildRepo = (overrides: Partial<RepoMock> = {}): RepoMock => ({
  findHighestIdentificador: mock.fn(async () => "HM00009"),
  createNovoIbc: mock.fn(async (data: CreateNovoIbcData) => buildCreatedIbc(data)),
  countVivosWp: mock.fn(async () => 0),
  createIbcLote: mock.fn(async (data: CreateIbcLoteData) => buildLote(data)),
  ...overrides,
});

describe("CreateLoteIbcUseCase core (#117 / #121 slice 2)", () => {
  it("batch creates N IBCs with shared dataLimite and COMPRA defaults", async () => {
    const created: CreateNovoIbcData[] = [];
    const repo = buildRepo({
      createNovoIbc: mock.fn(async (data: CreateNovoIbcData) => {
        created.push(data);
        return buildCreatedIbc(data);
      }),
    });
    const useCase = new CreateLoteIbcUseCase(repo as IIbcCadastroRepository);

    const result = await useCase.execute({
      quantidade: 3,
      dataLimite: FUTURE_DATA_LIMITE,
    });

    assert.equal(result.items.length, 3);
    assert.equal(result.lote.id, "lote-1");
    for (const item of result.items) {
      assert.equal(item.tipoCadastro, "NOVO");
      assert.equal(item.aptidao, "INAPTO");
      assert.equal(item.motivoInaptidao, "AGUARDANDO_INSPECAO");
      assert.equal(item.custodia, "PATIO");
      assert.equal(item.dataLimite?.toISOString(), FUTURE_DATA_LIMITE.toISOString());
      assert.equal(item.loteId, "lote-1");
    }
    assert.equal(created.length, 3);
  });

  it("batch assigns sequential unique HM identifiers", async () => {
    const repo = buildRepo({
      findHighestIdentificador: mock.fn(async () => "HM00009"),
    });
    const useCase = new CreateLoteIbcUseCase(repo as IIbcCadastroRepository);

    const result = await useCase.execute({
      quantidade: 3,
      dataLimite: FUTURE_DATA_LIMITE,
    });

    assert.deepEqual(
      result.items.map((i) => i.identificador),
      ["HM00010", "HM00011", "HM00012"],
    );
  });

  it("batch rejects past dataLimite like unit create", async () => {
    const createNovoIbc = mock.fn(async (data: CreateNovoIbcData) =>
      buildCreatedIbc(data),
    );
    const createIbcLote = mock.fn(async (data: CreateIbcLoteData) =>
      buildLote(data),
    );
    const repo = buildRepo({ createNovoIbc, createIbcLote });
    const useCase = new CreateLoteIbcUseCase(repo as IIbcCadastroRepository);

    await assert.rejects(
      () =>
        useCase.execute({
          quantidade: 2,
          dataLimite: PAST_DATA_LIMITE,
        }),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.equal(error.code, "IBC_DATA_LIMITE_INVALIDA");
        return true;
      },
    );
    assert.equal(createNovoIbc.mock.callCount(), 0);
    assert.equal(createIbcLote.mock.callCount(), 0);
  });

  it("rejects invalid N", async () => {
    const createNovoIbc = mock.fn(async (data: CreateNovoIbcData) =>
      buildCreatedIbc(data),
    );
    const repo = buildRepo({ createNovoIbc });
    const useCase = new CreateLoteIbcUseCase(repo as IIbcCadastroRepository);

    for (const quantidade of [0, -1, 201]) {
      await assert.rejects(
        () =>
          useCase.execute({
            quantidade,
            dataLimite: FUTURE_DATA_LIMITE,
          }),
        (error: unknown) => {
          assert.ok(error instanceof AppError);
          assert.equal(error.code, "IBC_LOTE_QUANTIDADE_INVALIDA");
          return true;
        },
      );
    }
    assert.equal(createNovoIbc.mock.callCount(), 0);
  });
});

describe("CreateLoteIbcUseCase soft ERP warning (#117 / #121 slice 3)", () => {
  it("soft warning when vivos plus N exceeds ERP saldo", async () => {
    const repo = buildRepo({
      countVivosWp: mock.fn(async () => 10),
    });
    const saldo = new FakeSaldoIbcErp({ status: "available", quantity: 12 });
    const useCase = new CreateLoteIbcUseCase(
      repo as IIbcCadastroRepository,
      saldo,
    );

    const result = await useCase.execute({
      quantidade: 5,
      dataLimite: FUTURE_DATA_LIMITE,
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
    const useCase = new CreateLoteIbcUseCase(
      repo as IIbcCadastroRepository,
      saldo,
    );

    const result = await useCase.execute({
      quantidade: 5,
      dataLimite: FUTURE_DATA_LIMITE,
    });

    assert.equal(result.items.length, 5);
    assert.equal(result.warning, undefined);
  });

  it("ERP saldo unavailable still allows lote", async () => {
    const repo = buildRepo({
      countVivosWp: mock.fn(async () => 3),
    });
    const saldo = new FakeSaldoIbcErp({ status: "unavailable" });
    const useCase = new CreateLoteIbcUseCase(
      repo as IIbcCadastroRepository,
      saldo,
    );

    const result = await useCase.execute({
      quantidade: 2,
      dataLimite: FUTURE_DATA_LIMITE,
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
    const useCase = new CreateLoteIbcUseCase(repo as IIbcCadastroRepository);

    const result = await useCase.execute({
      quantidade: 2,
      dataLimite: FUTURE_DATA_LIMITE,
      numeroNf: "123456",
    });

    assert.equal(result.lote.numeroNf, "123456");
    assert.ok(result.items.every((item) => item.loteId === result.lote.id));
  });

  it("allows lote without NF", async () => {
    const repo = buildRepo();
    const useCase = new CreateLoteIbcUseCase(repo as IIbcCadastroRepository);

    const result = await useCase.execute({
      quantidade: 2,
      dataLimite: FUTURE_DATA_LIMITE,
    });

    assert.equal(result.lote.numeroNf, null);
    assert.equal(result.items.length, 2);
  });
});
