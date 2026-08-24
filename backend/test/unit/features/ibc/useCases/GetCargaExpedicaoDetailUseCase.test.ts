import { describe, it, mock, after } from "node:test";
import assert from "node:assert/strict";
import { GetCargaExpedicaoDetailUseCase } from "../../../../../src/features/ibc/useCases/GetCargaExpedicaoDetail.use-case";
import { IIbcExpedicaoRepository } from "../../../../../src/features/ibc/repositories/IIbcExpedicaoRepository";
import { AppError } from "../../../../../src/utils/AppError";
import { PedidoCargo } from "../../../../../src/features/pedidos/types/PedidoCargo.types";
import {
  AlocacaoIbcRecord,
  CargaExpedicaoRef,
} from "../../../../../src/features/ibc/types/IbcExpedicao.types";

const buildCarga = (): CargaExpedicaoRef => ({
  id: "carga-1",
  codCar: 101,
  destino: "Blumenau",
  situacao: "ABERTA",
  previsaoSaida: new Date("2026-08-25T10:00:00.000Z"),
});

const buildPedido = (
  numPed: string,
  overrides: Partial<{
    isContainer: boolean;
    quantidadeEsperadaTotal: number;
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
    quantidadeEsperadaVenda: 2,
    quantidadeEsperadaEmprestimo: 1,
    ibcInvalido: overrides.ibcInvalido ?? false,
  });

const buildAlocacao = (
  overrides: Partial<AlocacaoIbcRecord> = {},
): AlocacaoIbcRecord => ({
  id: "aloc-1",
  ibcId: "ibc-1",
  cargaId: "carga-1",
  numPed: "1120",
  alocadoPorId: "almox-1",
  alocadoEm: new Date("2026-08-24T12:00:00.000Z"),
  expedicaoIbcId: null,
  identificador: "H0045",
  ...overrides,
});

describe("GetCargaExpedicaoDetailUseCase", () => {
  after(async () => {
    await new Promise((resolve) => setImmediate(resolve));
    await new Promise((resolve) => setTimeout(resolve, 50));
  });

  it("mostra progresso 2 de 3 no pedido e oculta pedidos sem embalagem 251001", async () => {
    const repo: Pick<
      IIbcExpedicaoRepository,
      | "getCargaByCodCar"
      | "getPedidosByCarga"
      | "listAlocacoesByCargaId"
      | "findExpedicaoByCargaId"
    > = {
      getCargaByCodCar: mock.fn(async () => buildCarga()),
      getPedidosByCarga: mock.fn(async () => [
        buildPedido("1120"),
        buildPedido("9999", {
          isContainer: false,
          quantidadeEsperadaTotal: 0,
        }),
      ]),
      listAlocacoesByCargaId: mock.fn(async () => [
        buildAlocacao({ id: "a1", ibcId: "i1", identificador: "H1" }),
        buildAlocacao({ id: "a2", ibcId: "i2", identificador: "H2" }),
      ]),
      findExpedicaoByCargaId: mock.fn(async () => null),
    };

    const useCase = new GetCargaExpedicaoDetailUseCase(
      repo as IIbcExpedicaoRepository,
    );
    const detail = await useCase.execute({ codCar: 101 });

    assert.strictEqual(detail.codCar, 101);
    assert.strictEqual(detail.pedidos.length, 1);
    assert.strictEqual(detail.pedidos[0].numPed, "1120");
    assert.strictEqual(detail.pedidos[0].quantidadeAlocada, 2);
    assert.strictEqual(detail.pedidos[0].quantidadeEsperadaTotal, 3);
    assert.strictEqual(detail.podeFecharExpedicao, false);
  });

  it("retorna 404 quando carga não existe", async () => {
    const repo: Pick<
      IIbcExpedicaoRepository,
      | "getCargaByCodCar"
      | "getPedidosByCarga"
      | "listAlocacoesByCargaId"
      | "findExpedicaoByCargaId"
    > = {
      getCargaByCodCar: mock.fn(async () => null),
      getPedidosByCarga: mock.fn(async () => []),
      listAlocacoesByCargaId: mock.fn(async () => []),
      findExpedicaoByCargaId: mock.fn(async () => null),
    };

    const useCase = new GetCargaExpedicaoDetailUseCase(
      repo as IIbcExpedicaoRepository,
    );

    await assert.rejects(
      async () => useCase.execute({ codCar: 404 }),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.strictEqual(error.code, "IBC_CARGA_NOT_FOUND");
        return true;
      },
    );
  });
});
