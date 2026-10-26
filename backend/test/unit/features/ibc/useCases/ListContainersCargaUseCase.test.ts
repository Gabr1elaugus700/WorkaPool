import { describe, it, mock, after } from "node:test";
import assert from "node:assert/strict";
import { GruposConfiguradosLookup } from "../../../../../src/features/ibc/services/carregarCompatibilidadeDePedidos";
import { ListContainersCargaUseCase } from "../../../../../src/features/ibc/useCases/ListContainersCarga.use-case";
import { IIbcExpedicaoRepository } from "../../../../../src/features/ibc/repositories/IIbcExpedicaoRepository";
import {
  AlocacaoIbcRecord,
  CargaPedidoIbcSnapshot,
  IbcPlacaRecord,
} from "../../../../../src/features/ibc/types/IbcExpedicao.types";

const AGORA = new Date("2026-10-26T12:00:00.000Z");

const pedido = (overrides: Partial<CargaPedidoIbcSnapshot> = {}): CargaPedidoIbcSnapshot => ({
  numPed: "1120",
  codCli: "C1",
  cliente: "Cliente",
  quantidadeEsperadaTotal: 4,
  quantidadeEsperadaVenda: 4,
  quantidadeEsperadaEmprestimo: 0,
  ibcInvalido: false,
  posCar: null,
  gruposCodigo: ["G020"],
  ...overrides,
});

const placa = (id: string, overrides: Partial<IbcPlacaRecord> = {}): IbcPlacaRecord => ({
  id,
  identificador: `HMAZ${id}`,
  prefixo: "HMAZ",
  dataLimite: null,
  universal: false,
  grupoCodigo: "G020",
  sigla: "AZ",
  corHex: "#2563EB",
  ...overrides,
});

const alocacao = (ibcId: string): AlocacaoIbcRecord => ({
  id: `aloc-${ibcId}`,
  ibcId,
  cargaId: "carga-1",
  numPed: null,
  alocadoPorId: "almox-1",
  alocadoEm: new Date("2026-10-25T12:00:00.000Z"),
  expedicaoIbcId: null,
  identificador: `HMAZ${ibcId}`,
});

const todosConfigurados: GruposConfiguradosLookup = {
  listGruposConfigurados: async (codigos) => codigos,
};

function buildRepo(overrides: Partial<IIbcExpedicaoRepository> = {}): IIbcExpedicaoRepository {
  return {
    getCargaByCodCar: mock.fn(async () => ({
      id: "carga-1",
      codCar: 383,
      destino: "Teste IBC",
      situacao: "FECHADA",
      previsaoSaida: new Date("2026-10-27T10:00:00.000Z"),
    })),
    listPedidosIbcByCargaId: mock.fn(async () => [pedido()]),
    listAlocacoesByCargaId: mock.fn(async () => []),
    findExpedicaoByCargaId: mock.fn(async () => null),
    listPlacasPorIds: mock.fn(async () => []),
    listIbcsLivresPorGrupos: mock.fn(async () => []),
    ...overrides,
  } as IIbcExpedicaoRepository;
}

const executar = (repo: IIbcExpedicaoRepository) =>
  new ListContainersCargaUseCase(repo, todosConfigurados).execute({ codCar: 383 }, AGORA);

describe("ListContainersCargaUseCase", () => {
  after(async () => {
    await new Promise((resolve) => setImmediate(resolve));
  });

  it("devolve vinculados com alocacaoId e livres compatíveis sem", async () => {
    const repo = buildRepo({
      listAlocacoesByCargaId: mock.fn(async () => [alocacao("1")]),
      listPlacasPorIds: mock.fn(async () => [placa("1")]),
      listIbcsLivresPorGrupos: mock.fn(async () => [placa("2")]),
    });

    const result = await executar(repo);

    assert.deepEqual(
      result.itens.map((item) => [item.identificador, item.alocacaoId]),
      [
        ["HMAZ1", "aloc-1"],
        ["HMAZ2", null],
      ],
    );
    assert.deepEqual(result.gruposPermitidos, [{ grupoCodigo: "G020", sigla: "AZ", corHex: "#2563EB" }]);
  });

  it("busca livres só pelos grupos configurados dos pedidos elegíveis", async () => {
    const listIbcsLivresPorGrupos = mock.fn(async (_grupos: readonly string[]) => []);
    const repo = buildRepo({
      listPedidosIbcByCargaId: mock.fn(async () => [
        pedido({ gruposCodigo: ["G020", "G099"] }),
        pedido({ numPed: "1121", ibcInvalido: true, gruposCodigo: ["G050"] }),
      ]),
      listIbcsLivresPorGrupos,
    });
    const soG020: GruposConfiguradosLookup = {
      listGruposConfigurados: async (codigos) => codigos.filter((codigo) => codigo === "G020"),
    };

    await new ListContainersCargaUseCase(repo, soG020).execute({ codCar: 383 }, AGORA);

    assert.deepEqual(listIbcsLivresPorGrupos.mock.calls[0].arguments, [["G020"]]);
  });

  it("marca não homologado pelo prefixo NH e mantém universal", async () => {
    const repo = buildRepo({
      listIbcsLivresPorGrupos: mock.fn(async () => [
        placa("3", { identificador: "NHAZ0003", prefixo: "NHAZ" }),
        placa("4", { identificador: "NH0004", prefixo: "NH", universal: true, grupoCodigo: null, sigla: null }),
      ]),
    });

    const result = await executar(repo);

    assert.deepEqual(
      result.itens.map((item) => [item.identificador, item.homologado, item.universal]),
      [
        ["NHAZ0003", false, false],
        ["NH0004", false, true],
      ],
    );
  });

  it("exclui legado HM####, grupo de fora, data limite vencida e quem já está na carga", async () => {
    const repo = buildRepo({
      listAlocacoesByCargaId: mock.fn(async () => [alocacao("1")]),
      listPlacasPorIds: mock.fn(async () => [placa("1")]),
      listIbcsLivresPorGrupos: mock.fn(async () => [
        placa("1"),
        placa("5", { identificador: "HM0005", prefixo: "HM", universal: true, grupoCodigo: null }),
        placa("6", { grupoCodigo: "G031" }),
        placa("7", { dataLimite: new Date("2026-10-26T00:00:00.000Z") }),
        placa("8", { dataLimite: new Date("2026-11-30T00:00:00.000Z") }),
      ]),
    });

    const result = await executar(repo);

    assert.deepEqual(
      result.itens.map((item) => item.ibcId),
      ["1", "8"],
    );
  });

  it("com a expedição fechada devolve só os vinculados", async () => {
    const listIbcsLivresPorGrupos = mock.fn(async () => [placa("2")]);
    const repo = buildRepo({
      findExpedicaoByCargaId: mock.fn(async () => ({
        id: "exp-1",
        cargaId: "carga-1",
        fechadoPorId: "almox-1",
        fechadoEm: AGORA,
      })),
      listAlocacoesByCargaId: mock.fn(async () => [alocacao("1")]),
      listPlacasPorIds: mock.fn(async () => [placa("1")]),
      listIbcsLivresPorGrupos,
    });

    const result = await executar(repo);

    assert.deepEqual(result.itens.map((item) => item.ibcId), ["1"]);
    assert.strictEqual(listIbcsLivresPorGrupos.mock.callCount(), 0);
  });
});
