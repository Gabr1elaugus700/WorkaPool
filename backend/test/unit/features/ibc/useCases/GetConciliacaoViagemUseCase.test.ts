import { describe, it, mock } from "node:test";
import assert from "node:assert/strict";
import { Role } from "@prisma/client";
import { GetConciliacaoViagemUseCase } from "../../../../../src/features/ibc/useCases/GetConciliacaoViagem.use-case";
import { IIbcExpedicaoRepository } from "../../../../../src/features/ibc/repositories/IIbcExpedicaoRepository";
import { IIbcConciliacaoRepository } from "../../../../../src/features/ibc/repositories/IbcConciliacaoRepository";
import { AppError } from "../../../../../src/utils/AppError";
import {
  AlocacaoIbcRecord,
  CargaExpedicaoRef,
  CargaPedidoIbcSnapshot,
} from "../../../../../src/features/ibc/types/IbcExpedicao.types";

const carga = (): CargaExpedicaoRef => ({
  id: "carga-1",
  codCar: 202,
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
  posCar: 1,
  ...overrides,
});

const alocacao = (identificador: string, numPed: string): AlocacaoIbcRecord => ({
  id: `aloc-${identificador}`,
  ibcId: `ibc-${identificador}`,
  cargaId: "carga-1",
  numPed,
  alocadoPorId: "almox-1",
  alocadoEm: new Date("2026-10-11T12:00:00.000Z"),
  expedicaoIbcId: "exp-1",
  identificador,
});

function repos(overrides: {
  expedicao?: Partial<IIbcExpedicaoRepository>;
  conciliacao?: Partial<IIbcConciliacaoRepository>;
} = {}) {
  const expedicoes: IIbcExpedicaoRepository = {
    getCargaByCodCar: mock.fn(async () => carga()),
    listPedidosIbcByCargaId: mock.fn(async () => [
      pedido({ numPed: "10", codCli: "B", cliente: "Beta", posCar: 1, quantidadeEsperadaVenda: 0, quantidadeEsperadaEmprestimo: 1 }),
      pedido({ numPed: "20", codCli: "A", cliente: "Acme", posCar: 2, quantidadeEsperadaVenda: 2, quantidadeEsperadaEmprestimo: 1 }),
    ]),
    listAlocacoesByCargaId: mock.fn(async () => [alocacao("H0020", "20"), alocacao("H0010", "10")]),
    ...overrides.expedicao,
  } as IIbcExpedicaoRepository;
  const conciliacoes: IIbcConciliacaoRepository = {
    findPorCarga: mock.fn(async () => ({ id: "exp-1", viagemFechadaEm: null, viagemFechadaPorId: null })),
    listMarcas: mock.fn(async () => [
      { alocacaoIbcId: "aloc-H0010", destino: "FICOU" as const, modalidade: "EMPRESTIMO" as const, ibcEntradaId: null },
    ]),
    listRetornos: mock.fn(async () => [
      { chaveCliente: "B\u0000Beta", quantidadePapel: 1, confirmouDivergencia: false },
    ]),
    ...overrides.conciliacao,
  };
  return { expedicoes, conciliacoes };
}

const hasCode = (code: string, statusCode: number) => (error: unknown) => {
  assert.ok(error instanceof AppError);
  assert.equal(error.code, code);
  assert.equal(error.statusCode, statusCode);
  return true;
};

describe("GetConciliacaoViagemUseCase", () => {
  it("recusa papel sem escrita", async () => {
    const { expedicoes, conciliacoes } = repos();
    const useCase = new GetConciliacaoViagemUseCase(expedicoes, conciliacoes);
    await assert.rejects(() => useCase.execute({ codCar: 202, actorRole: Role.LOGISTICA }), hasCode("IBC_VIAGEM_FORBIDDEN", 403));
  });

  it("recusa carga sem expedição", async () => {
    const { expedicoes, conciliacoes } = repos({
      conciliacao: { findPorCarga: mock.fn(async () => null) },
    });
    await assert.rejects(
      () => new GetConciliacaoViagemUseCase(expedicoes, conciliacoes).execute({ codCar: 202, actorRole: Role.ALMOX }),
      hasCode("IBC_EXPEDICAO_AUSENTE", 409),
    );
  });

  it("devolve o checklist com sugestão do pedido e o papel já lançado", async () => {
    const { expedicoes, conciliacoes } = repos();
    const view = await new GetConciliacaoViagemUseCase(expedicoes, conciliacoes).execute({
      codCar: 202,
      actorRole: Role.ADMIN,
    });

    assert.equal(view.expedicaoIbcId, "exp-1");
    assert.equal(view.viagemFechadaEm, null);
    assert.deepEqual(view.itens.map((item) => item.identificador), ["H0010", "H0020"]);
    assert.equal(view.itens[0]?.destino, "FICOU");
    assert.equal(view.itens[0]?.modalidade, "EMPRESTIMO");
    assert.equal(view.itens[0]?.modalidadeSugerida, "EMPRESTIMO");
    assert.equal(view.itens[1]?.destino, null);
    assert.equal(view.itens[1]?.modalidadeSugerida, null);
    assert.deepEqual(view.clientes, [
      { chaveCliente: "B\u0000Beta", codCli: "B", cliente: "Beta", quantidadePapel: 1, confirmouDivergencia: false },
      { chaveCliente: "A\u0000Acme", codCli: "A", cliente: "Acme", quantidadePapel: null, confirmouDivergencia: false },
    ]);
  });
});
