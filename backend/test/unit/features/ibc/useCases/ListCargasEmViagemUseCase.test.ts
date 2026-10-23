import { describe, it, mock, after } from "node:test";
import assert from "node:assert/strict";
import { ListCargasEmViagemUseCase } from "../../../../../src/features/ibc/useCases/ListCargasEmViagem.use-case";
import { IIbcExpedicaoRepository } from "../../../../../src/features/ibc/repositories/IIbcExpedicaoRepository";
import {
  AlocacaoIbcEmViagemRecord,
  CargaEmViagem,
  CargaPedidoIbcSnapshot,
} from "../../../../../src/features/ibc/types/IbcExpedicao.types";

const pedido = (
  numPed: string,
  overrides: Partial<CargaPedidoIbcSnapshot> = {},
): CargaPedidoIbcSnapshot => ({
  numPed,
  codCli: "C1",
  cliente: "Cliente",
  quantidadeEsperadaTotal: 1,
  quantidadeEsperadaVenda: 1,
  quantidadeEsperadaEmprestimo: 0,
  ibcInvalido: false,
  posCar: null,
  gruposCodigo: [],
  ...overrides,
});

const alocacao = (
  overrides: Partial<AlocacaoIbcEmViagemRecord> = {},
): AlocacaoIbcEmViagemRecord => ({
  id: "aloc-1",
  ibcId: "ibc-1",
  cargaId: "carga-1",
  numPed: "1120",
  alocadoPorId: "almox-1",
  alocadoEm: new Date("2026-10-01T12:00:00.000Z"),
  expedicaoIbcId: "exp-1",
  identificador: "H0001",
  custodia: "EM_VIAGEM",
  ...overrides,
});

const carga = (overrides: Partial<CargaEmViagem> = {}): CargaEmViagem => ({
  id: "carga-1",
  codCar: 101,
  destino: "Blumenau",
  situacao: "FECHADA",
  previsaoSaida: new Date("2026-10-02T10:00:00.000Z"),
  pedidosIbc: [pedido("1120")],
  alocacoes: [alocacao()],
  expedicao: {
    id: "exp-1",
    cargaId: "carga-1",
    fechadoPorId: "almox-1",
    fechadoEm: new Date("2026-10-03T15:00:00.000Z"),
  },
  ...overrides,
});

describe("ListCargasEmViagemUseCase", () => {
  after(async () => {
    await new Promise((resolve) => setImmediate(resolve));
  });

  it("preserva a ordem do repositório e conta pedidos elegíveis e IBCs", async () => {
    const recente = carga({
      codCar: 200,
      expedicao: {
        id: "exp-200",
        cargaId: "carga-200",
        fechadoPorId: "almox-1",
        fechadoEm: new Date("2026-10-04T15:00:00.000Z"),
      },
      pedidosIbc: [
        pedido("1122", { ibcInvalido: true, quantidadeEsperadaTotal: 0 }),
        pedido("1120", { quantidadeEsperadaTotal: 2 }),
      ],
      alocacoes: [
        alocacao({ id: "a1", custodia: "EM_VIAGEM" }),
        alocacao({ id: "a2", ibcId: "ibc-2", custodia: "PATIO" }),
      ],
    });
    const antiga = carga({ codCar: 100 });
    const listCargasEmViagem = mock.fn(async () => [recente, antiga]);
    const repo: Pick<IIbcExpedicaoRepository, "listCargasEmViagem"> = {
      listCargasEmViagem,
    };

    const result = await new ListCargasEmViagemUseCase(
      repo as IIbcExpedicaoRepository,
    ).execute();

    assert.equal(listCargasEmViagem.mock.callCount(), 1);
    assert.deepEqual(
      result.cargas.map((item) => item.codCar),
      [200, 100],
    );
    assert.equal(
      result.cargas[0]?.fechadoEm.toISOString(),
      "2026-10-04T15:00:00.000Z",
    );
    assert.equal(result.cargas[0]?.quantidadePedidos, 1);
    assert.equal(result.cargas[0]?.quantidadeIbcs, 2);
    assert.equal(result.cargas[0]?.quantidadeIbcsEmViagem, 1);
    assert.equal(result.cargas[0]?.destino, "Blumenau");
    assert.equal(result.cargas[0]?.situacao, "FECHADA");
  });

  it("deduplica clientes na ordem de entrega (posCar, depois numPed)", async () => {
    const repo: Pick<IIbcExpedicaoRepository, "listCargasEmViagem"> = {
      listCargasEmViagem: mock.fn(async () => [
        carga({
          pedidosIbc: [
            pedido("3000", { cliente: "Sem posição", codCli: "C3", posCar: null }),
            pedido("1121", { cliente: "Segundo", codCli: "C2", posCar: 2 }),
            pedido("1120", { cliente: "Primeiro", codCli: "C1", posCar: 1 }),
            pedido("1122", { cliente: "Primeiro", codCli: "C1", posCar: 3 }),
            pedido("9000", {
              cliente: "Inválido",
              codCli: "C9",
              posCar: 0,
              ibcInvalido: true,
              quantidadeEsperadaTotal: 0,
            }),
          ],
        }),
      ]),
    };

    const result = await new ListCargasEmViagemUseCase(
      repo as IIbcExpedicaoRepository,
    ).execute();

    assert.deepEqual(result.cargas[0]?.clientes, [
      { cliente: "Primeiro", codCli: "C1" },
      { cliente: "Segundo", codCli: "C2" },
      { cliente: "Sem posição", codCli: "C3" },
    ]);
  });
});
