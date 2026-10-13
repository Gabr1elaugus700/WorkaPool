import { describe, it, mock } from "node:test";
import assert from "node:assert/strict";
import { Role } from "@prisma/client";
import { planejarFechamentoViagem } from "../../../../../src/features/ibc/services/planejarFechamentoViagem";
import { FecharViagemIbcUseCase } from "../../../../../src/features/ibc/useCases/FecharViagemIbc.use-case";
import { IIbcExpedicaoRepository } from "../../../../../src/features/ibc/repositories/IIbcExpedicaoRepository";
import { FecharViagemComando, IIbcConciliacaoRepository } from "../../../../../src/features/ibc/repositories/IbcConciliacaoRepository";
import { AbrirEntradaPatioUseCase } from "../../../../../src/features/ibc/useCases/AbrirEntradaPatio.use-case";
import { AppError } from "../../../../../src/utils/AppError";
import { MarcaConciliacaoSalva } from "../../../../../src/features/ibc/repositories/IbcConciliacaoRepository";
import { AlocacaoIbcRecord, CargaExpedicaoRef, CargaPedidoIbcSnapshot } from "../../../../../src/features/ibc/types/IbcExpedicao.types";
import { conciliacaoViagem } from "../../../../../src/features/ibc/services/conciliacaoViagem";

const NOW = new Date("2026-10-13T15:00:00.000Z");
const chave = conciliacaoViagem.chaveCliente("B", "Beta");

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

const alocacao = (id: string, identificador: string): AlocacaoIbcRecord => ({
  id,
  ibcId: `ibc-${id}`,
  cargaId: "carga-1",
  numPed: "10",
  alocadoPorId: "almox-1",
  alocadoEm: NOW,
  expedicaoIbcId: "exp-1",
  identificador,
});

const papel = (quantidadePapel: number, confirmouDivergencia = false) => [
  { chaveCliente: chave, quantidadePapel, confirmouDivergencia },
];

const hasCode = (code: string) => (error: unknown) => {
  assert.ok(error instanceof AppError);
  assert.equal(error.code, code);
  return true;
};

describe("planejarFechamentoViagem", () => {
  it("exige destino em todo IBC e papel em todo cliente", () => {
    assert.throws(
      () => planejarFechamentoViagem({ now: NOW, alocacoes: [alocacao("a1", "H1")], pedidos: [pedido()], marcas: [], retornos: papel(0) }),
      hasCode("IBC_VIAGEM_INCOMPLETA"),
    );
    const marca: MarcaConciliacaoSalva = { alocacaoIbcId: "a1", destino: "RETORNOU", modalidade: null, ibcEntradaId: null };
    assert.throws(
      () => planejarFechamentoViagem({ now: NOW, alocacoes: [alocacao("a1", "H1")], pedidos: [pedido()], marcas: [marca], retornos: [] }),
      hasCode("IBC_VIAGEM_INCOMPLETA"),
    );
  });

  it("vende, empresta, devolve e troca sem apagar a alocação de quem ficou", () => {
    const alocs = [alocacao("venda", "H1"), alocacao("emp", "H2"), alocacao("ret", "H3"), alocacao("troca", "H4")];
    const marcas: MarcaConciliacaoSalva[] = [
      { alocacaoIbcId: "venda", destino: "FICOU", modalidade: "VENDA", ibcEntradaId: null },
      { alocacaoIbcId: "emp", destino: "FICOU", modalidade: "EMPRESTIMO", ibcEntradaId: null },
      { alocacaoIbcId: "ret", destino: "RETORNOU", modalidade: null, ibcEntradaId: null },
      { alocacaoIbcId: "troca", destino: "TROCA", modalidade: null, ibcEntradaId: "ibc-in" },
    ];
    const plano = planejarFechamentoViagem({ now: NOW, alocacoes: alocs, pedidos: [pedido()], marcas, retornos: papel(1, true) });
    const porId = new Map(plano.efeitos.map((efeito) => [efeito.alocacaoIbcId, efeito]));
    assert.equal(porId.get("venda")?.motivoBaixa, "VENDA");
    assert.equal(porId.get("venda")?.encerrarAlocacao, false);
    assert.equal(porId.get("emp")?.motivoBaixa, null);
    assert.equal(porId.get("emp")?.emprestimoVenceEm?.toISOString(), "2027-01-11T15:00:00.000Z");
    assert.equal(porId.get("ret")?.encerrarAlocacao, true);
    assert.equal(porId.get("ret")?.custodia, null);
    assert.equal(porId.get("troca")?.motivoBaixa, "TROCA");
    assert.equal(porId.get("troca")?.trocaEntradaId, "ibc-in");
    assert.deepEqual(plano.entradas, [
      { ibcId: "ibc-ret", origem: "RETORNO" },
      { ibcId: "ibc-in", origem: "TROCA" },
    ]);
    assert.deepEqual(plano.ficaram.map((item) => item.modalidade), ["VENDA", "EMPRESTIMO"]);
  });

  it("bloqueia troca sem entrada e divergência do papel sem confirmação", () => {
    const marca: MarcaConciliacaoSalva = { alocacaoIbcId: "troca", destino: "TROCA", modalidade: null, ibcEntradaId: null };
    assert.throws(
      () => planejarFechamentoViagem({ now: NOW, alocacoes: [alocacao("troca", "H4")], pedidos: [pedido()], marcas: [marca], retornos: papel(1) }),
      hasCode("IBC_TROCA_SEM_ENTRADA"),
    );
    const vinculada: MarcaConciliacaoSalva = { ...marca, ibcEntradaId: "ibc-in" };
    assert.throws(
      () => planejarFechamentoViagem({ now: NOW, alocacoes: [alocacao("troca", "H4")], pedidos: [pedido()], marcas: [vinculada], retornos: papel(0) }),
      hasCode("IBC_TROCA_DIVERGENCIA"),
    );
  });
});

describe("FecharViagemIbcUseCase", () => {
  it("abre as entradas na mesma transação e grava o fechamento", async () => {
    const marca: MarcaConciliacaoSalva = { alocacaoIbcId: "ret", destino: "RETORNOU", modalidade: null, ibcEntradaId: null };
    let abriu = false;
    const fecharViagem = mock.fn(async (cmd: FecharViagemComando, abrir: () => Promise<void>) => {
      assert.equal(cmd.efeitos[0]?.encerrarAlocacao, true);
      await abrir();
      abriu = true;
    });
    const execute = mock.fn(async () => ({ id: "entrada-1" }));
    const conciliacoes = {
      findPorCarga: async () => ({ id: "exp-1", viagemFechadaEm: null, viagemFechadaPorId: null }),
      listMarcas: async () => [marca],
      listRetornos: async () => papel(0),
      save: async () => undefined,
      vincularEntradaTroca: async () => true,
      fecharViagem,
    } as unknown as IIbcConciliacaoRepository;
    const expedicoes = {
      getCargaByCodCar: async () => ({ id: "carga-1", codCar: 202, destino: "Blumenau", situacao: "FECHADA", previsaoSaida: NOW } satisfies CargaExpedicaoRef),
      listPedidosIbcByCargaId: async () => [pedido()],
      listAlocacoesByCargaId: async () => [alocacao("ret", "H3")],
    } as unknown as IIbcExpedicaoRepository;
    const result = await new FecharViagemIbcUseCase(
      expedicoes,
      conciliacoes,
      { execute } as unknown as AbrirEntradaPatioUseCase,
      () => NOW,
    ).execute({ codCar: 202, actorRole: Role.ADMIN, actorId: "almox-1" });
    assert.equal(abriu, true);
    assert.equal(execute.mock.callCount(), 1);
    assert.equal(result.viagemFechadaEm, NOW);
  });

  it("recusa papel sem escrita antes de fechar", async () => {
    const fecharViagem = mock.fn(async () => undefined);
    const conciliacoes = { fecharViagem } as unknown as IIbcConciliacaoRepository;
    await assert.rejects(
      () => new FecharViagemIbcUseCase(
        {} as IIbcExpedicaoRepository,
        conciliacoes,
        { execute: async () => ({}) } as unknown as AbrirEntradaPatioUseCase,
      ).execute({ codCar: 202, actorRole: Role.LOGISTICA, actorId: "x" }),
      hasCode("IBC_VIAGEM_FORBIDDEN"),
    );
    assert.equal(fecharViagem.mock.callCount(), 0);
  });
});
