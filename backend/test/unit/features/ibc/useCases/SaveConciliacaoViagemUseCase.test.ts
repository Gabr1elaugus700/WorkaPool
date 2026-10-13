import { describe, it, mock } from "node:test";
import assert from "node:assert/strict";
import { Role } from "@prisma/client";
import { SaveConciliacaoViagemUseCase } from "../../../../../src/features/ibc/useCases/SaveConciliacaoViagem.use-case";
import { IIbcExpedicaoRepository } from "../../../../../src/features/ibc/repositories/IIbcExpedicaoRepository";
import {
  IIbcConciliacaoRepository,
  MarcaConciliacaoSalva,
  RetornoSemIdSalvo,
  SalvarConciliacaoData,
} from "../../../../../src/features/ibc/repositories/IbcConciliacaoRepository";
import { AppError } from "../../../../../src/utils/AppError";
import { AlocacaoIbcRecord, CargaExpedicaoRef, CargaPedidoIbcSnapshot } from "../../../../../src/features/ibc/types/IbcExpedicao.types";
import { conciliacaoViagem } from "../../../../../src/features/ibc/services/conciliacaoViagem";

const carga = (): CargaExpedicaoRef => ({
  id: "carga-1",
  codCar: 202,
  destino: "Blumenau",
  situacao: "FECHADA",
  previsaoSaida: new Date("2026-10-12T10:00:00.000Z"),
});

const pedido = (): CargaPedidoIbcSnapshot => ({
  numPed: "10",
  codCli: "B",
  cliente: "Beta",
  quantidadeEsperadaTotal: 1,
  quantidadeEsperadaVenda: 1,
  quantidadeEsperadaEmprestimo: 0,
  ibcInvalido: false,
  posCar: 1,
});

const alocacao = (): AlocacaoIbcRecord => ({
  id: "aloc-1",
  ibcId: "ibc-1",
  cargaId: "carga-1",
  numPed: "10",
  alocadoPorId: "almox-1",
  alocadoEm: new Date("2026-10-11T12:00:00.000Z"),
  expedicaoIbcId: "exp-1",
  identificador: "H0010",
});

const chave = conciliacaoViagem.chaveCliente("B", "Beta");

function harness(options: { fechada?: boolean; marcas?: MarcaConciliacaoSalva[] } = {}) {
  let marcas = options.marcas ?? [];
  let retornos: RetornoSemIdSalvo[] = [];
  const save = mock.fn(async (data: SalvarConciliacaoData) => {
    marcas = data.marcas.map((marca) => ({ ...marca, ibcEntradaId: marcas.find((atual) => atual.alocacaoIbcId === marca.alocacaoIbcId)?.ibcEntradaId ?? null }));
    retornos = data.retornos;
  });
  const conciliacoes: IIbcConciliacaoRepository = {
    findPorCarga: mock.fn(async () => ({
      id: "exp-1",
      viagemFechadaEm: options.fechada ? new Date("2026-10-13T12:00:00.000Z") : null,
      viagemFechadaPorId: options.fechada ? "almox-1" : null,
    })),
    listMarcas: mock.fn(async () => marcas),
    listRetornos: mock.fn(async () => retornos),
    save,
  };
  const expedicoes = {
    getCargaByCodCar: mock.fn(async () => carga()),
    listPedidosIbcByCargaId: mock.fn(async () => [pedido()]),
    listAlocacoesByCargaId: mock.fn(async () => [alocacao()]),
  } as unknown as IIbcExpedicaoRepository;
  return { useCase: new SaveConciliacaoViagemUseCase(expedicoes, conciliacoes), save };
}

const hasCode = (code: string, statusCode: number) => (error: unknown) => {
  assert.ok(error instanceof AppError);
  assert.equal(error.code, code);
  assert.equal(error.statusCode, statusCode);
  return true;
};

const input = {
  codCar: 202,
  actorRole: Role.ALMOX,
  actorId: "almox-1",
};

describe("SaveConciliacaoViagemUseCase", () => {
  it("grava só o que veio e devolve a conciliação atualizada", async () => {
    const { useCase, save } = harness();
    const view = await useCase.execute({
      ...input,
      itens: [{ alocacaoIbcId: "aloc-1", destino: "FICOU", modalidade: "VENDA" }],
      retornosSemId: [{ chaveCliente: chave, quantidadePapel: 0 }],
    });
    assert.equal(save.mock.callCount(), 1);
    const gravado = save.mock.calls[0]?.arguments[0] as SalvarConciliacaoData;
    assert.equal(gravado.lancadoPorId, "almox-1");
    assert.deepEqual(gravado.marcas, [{ alocacaoIbcId: "aloc-1", destino: "FICOU", modalidade: "VENDA" }]);
    assert.equal(gravado.retornos[0]?.confirmouDivergencia, false);
    assert.equal(view.itens[0]?.destino, "FICOU");
    assert.equal(view.itens[0]?.modalidadeSugerida, "VENDA");
    assert.equal(view.clientes[0]?.quantidadePapel, 0);
  });

  it("não grava viagem fechada, IBC de fora, modalidade inválida nem troca já vinculada", async () => {
    const fechada = harness({ fechada: true });
    await assert.rejects(
      () => fechada.useCase.execute({ ...input, itens: [], retornosSemId: [] }),
      hasCode("IBC_VIAGEM_JA_FECHADA", 409),
    );
    assert.equal(fechada.save.mock.callCount(), 0);

    const { useCase, save } = harness();
    await assert.rejects(
      () => useCase.execute({ ...input, itens: [{ alocacaoIbcId: "outra", destino: "RETORNOU" }], retornosSemId: [] }),
      hasCode("IBC_CONCILIACAO_FORA_DA_VIAGEM", 409),
    );
    await assert.rejects(
      () => useCase.execute({ ...input, itens: [{ alocacaoIbcId: "aloc-1", destino: "FICOU" }], retornosSemId: [] }),
      hasCode("IBC_CONCILIACAO_MODALIDADE", 422),
    );
    await assert.rejects(
      () => useCase.execute({ ...input, itens: [{ alocacaoIbcId: "aloc-1", destino: "RETORNOU", modalidade: "VENDA" }], retornosSemId: [] }),
      hasCode("IBC_CONCILIACAO_MODALIDADE", 422),
    );
    await assert.rejects(
      () => useCase.execute({ ...input, itens: [], retornosSemId: [{ chaveCliente: "x\u0000y", quantidadePapel: 1 }] }),
      hasCode("IBC_CONCILIACAO_FORA_DA_VIAGEM", 409),
    );
    assert.equal(save.mock.callCount(), 0);

    const vinculada = harness({
      marcas: [{ alocacaoIbcId: "aloc-1", destino: "TROCA", modalidade: null, ibcEntradaId: "ibc-in" }],
    });
    await assert.rejects(
      () => vinculada.useCase.execute({ ...input, itens: [{ alocacaoIbcId: "aloc-1", destino: "RETORNOU" }], retornosSemId: [] }),
      hasCode("IBC_TROCA_JA_VINCULADA", 409),
    );
    assert.equal(vinculada.save.mock.callCount(), 0);
  });

  it("recusa papel sem escrita", async () => {
    const { useCase, save } = harness();
    await assert.rejects(
      () => useCase.execute({ ...input, actorRole: Role.USER, itens: [], retornosSemId: [] }),
      hasCode("IBC_VIAGEM_FORBIDDEN", 403),
    );
    assert.equal(save.mock.callCount(), 0);
  });
});
