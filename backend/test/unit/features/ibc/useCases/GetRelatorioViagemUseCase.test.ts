import { describe, it, mock } from "node:test";
import assert from "node:assert/strict";
import { GetRelatorioViagemUseCase } from "../../../../../src/features/ibc/useCases/GetRelatorioViagem.use-case";
import { IIbcExpedicaoRepository } from "../../../../../src/features/ibc/repositories/IIbcExpedicaoRepository";
import { AppError } from "../../../../../src/utils/AppError";
import {
  AlocacaoIbcRecord,
  CargaExpedicaoRef,
  CargaPedidoIbcSnapshot,
  ExpedicaoIbcRecord,
} from "../../../../../src/features/ibc/types/IbcExpedicao.types";

const CARGA_ID = "carga-1";
const COD_CAR = 202;
const FECHADO_EM = new Date("2026-10-11T18:30:00.000Z");

const carga = (): CargaExpedicaoRef => ({
  id: CARGA_ID,
  codCar: COD_CAR,
  destino: "Blumenau",
  situacao: "FECHADA",
  previsaoSaida: new Date("2026-10-12T10:00:00.000Z"),
});

const pedido = (
  overrides: Partial<CargaPedidoIbcSnapshot> & Pick<CargaPedidoIbcSnapshot, "numPed">,
): CargaPedidoIbcSnapshot => ({
  codCli: "C1",
  cliente: "Cliente",
  quantidadeEsperadaTotal: 1,
  quantidadeEsperadaVenda: 1,
  quantidadeEsperadaEmprestimo: 0,
  ibcInvalido: false,
  posCar: null,
  ...overrides,
});

const alocacao = (identificador: string, numPed = "10"): AlocacaoIbcRecord => ({
  id: `aloc-${identificador}`,
  ibcId: `ibc-${identificador}`,
  cargaId: CARGA_ID,
  numPed,
  alocadoPorId: "almox-1",
  alocadoEm: new Date("2026-10-11T12:00:00.000Z"),
  expedicaoIbcId: "exp-1",
  identificador,
});

const expedicao = (): ExpedicaoIbcRecord => ({
  id: "exp-1",
  cargaId: CARGA_ID,
  fechadoPorId: "almox-1",
  fechadoEm: FECHADO_EM,
});

type Repo = Pick<
  IIbcExpedicaoRepository,
  | "getCargaByCodCar"
  | "listPedidosIbcByCargaId"
  | "listAlocacoesByCargaId"
  | "findExpedicaoByCargaId"
  | "findPlacaByCargaId"
>;

const repo = (overrides: Partial<Repo> = {}): Repo => ({
  getCargaByCodCar: mock.fn(async () => carga()),
  listPedidosIbcByCargaId: mock.fn(async () => [
    pedido({ numPed: "20", codCli: "A", cliente: "Acme", posCar: 3 }),
    pedido({ numPed: "10", codCli: "B", cliente: "Beta", posCar: 1 }),
  ]),
  listAlocacoesByCargaId: mock.fn(async () => [
    alocacao("H0010", "20"),
    alocacao("H0002", "10"),
    alocacao("H0002", "10"),
    alocacao("H0001", "20"),
  ]),
  findExpedicaoByCargaId: mock.fn(async () => expedicao()),
  findPlacaByCargaId: mock.fn(async () => "ABC1D23"),
  ...overrides,
});

const execute = (overrides: Partial<Repo> = {}) =>
  new GetRelatorioViagemUseCase(repo(overrides) as IIbcExpedicaoRepository).execute({
    codCar: COD_CAR,
  });

describe("GetRelatorioViagemUseCase", () => {
  it("ordena clientes pelo menor posCar e pedidos do cliente por numPed", async () => {
    const relatorio = await execute({
      listPedidosIbcByCargaId: mock.fn(async () => [
        pedido({
          numPed: "50",
          codCli: "A",
          cliente: "Acme",
          posCar: null,
          quantidadeEsperadaTotal: 2,
          quantidadeEsperadaVenda: 1,
          quantidadeEsperadaEmprestimo: 1,
        }),
        pedido({
          numPed: "40",
          codCli: "A",
          cliente: "Acme",
          posCar: 8,
          quantidadeEsperadaVenda: 2,
          quantidadeEsperadaEmprestimo: 0,
          quantidadeEsperadaTotal: 2,
        }),
        pedido({
          numPed: "12",
          codCli: "B",
          cliente: "Beta",
          posCar: 2,
          quantidadeEsperadaVenda: 0,
          quantidadeEsperadaEmprestimo: 3,
          quantidadeEsperadaTotal: 3,
        }),
      ]),
    });

    assert.deepEqual(
      relatorio.clientes.map((cliente) => cliente.cliente),
      ["Beta", "Acme"],
    );
    assert.deepEqual(relatorio.clientes[1].pedidos, [
      { numPed: "40", quantidade: 2, modalidade: "Embalagem Inclusa (Venda)" },
      { numPed: "50", quantidade: 1, modalidade: "Embalagem Inclusa (Venda)" },
      { numPed: "50", quantidade: 1, modalidade: "Empréstimo" },
    ]);
    assert.equal(relatorio.placa, "ABC1D23");
    assert.equal(relatorio.destino, "Blumenau");
    assert.equal(relatorio.fechadoEm, FECHADO_EM);
    assert.equal(relatorio.totalClientes, 2);
  });

  it("sem posCar ordena o cliente pelo menor numPed", async () => {
    const relatorio = await execute({
      listPedidosIbcByCargaId: mock.fn(async () => [
        pedido({ numPed: "30", codCli: "A", cliente: "Acme", posCar: null }),
        pedido({ numPed: "10", codCli: "B", cliente: "Beta", posCar: null }),
        pedido({
          numPed: "99",
          codCli: "C",
          cliente: "Celta",
          posCar: null,
          ibcInvalido: true,
          quantidadeEsperadaTotal: 0,
        }),
      ]),
    });

    assert.deepEqual(
      relatorio.clientes.map((cliente) => cliente.codCli),
      ["B", "A"],
    );
  });

  it("repete o checklist completo da carga em cada cliente, por identificador", async () => {
    const relatorio = await execute();
    const esperado = [
      { identificador: "H0001" },
      { identificador: "H0002" },
      { identificador: "H0010" },
    ];

    assert.equal(relatorio.totalIbcs, 3);
    assert.deepEqual(relatorio.clientes[0].checklist, esperado);
    assert.deepEqual(relatorio.clientes[1].checklist, esperado);
    assert.deepEqual(
      Object.keys(relatorio.clientes[0].pedidos[0]).sort(),
      ["modalidade", "numPed", "quantidade"],
    );
  });

  it("devolve placa nula quando a carga não tem CargaDespacho", async () => {
    const relatorio = await execute({
      findPlacaByCargaId: mock.fn(async () => null),
    });
    assert.equal(relatorio.placa, null);
  });

  it("responde 404 quando a carga não existe", async () => {
    await assert.rejects(
      () => execute({ getCargaByCodCar: mock.fn(async () => null) }),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, 404);
        assert.equal(error.code, "IBC_CARGA_NOT_FOUND");
        return true;
      },
    );
  });

  it("responde 409 quando a carga não tem ExpedicaoIbc", async () => {
    await assert.rejects(
      () => execute({ findExpedicaoByCargaId: mock.fn(async () => null) }),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, 409);
        assert.equal(error.code, "IBC_EXPEDICAO_AUSENTE");
        return true;
      },
    );
  });
});
