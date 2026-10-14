import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { selecionarEmprestimosAtrasados } from "../../../../../src/features/ibc/services/selecionarEmprestimosAtrasados";
import type {
  EscopoLeituraEmprestimosAtrasados,
  LinhaEmprestimoAtrasado,
} from "../../../../../src/features/ibc/types/EmprestimoAtrasado.types";

const NOW = new Date("2026-10-14T12:00:00.000Z");
const UM_MS_ANTES = new Date(NOW.getTime() - 1);
const TODAS: EscopoLeituraEmprestimosAtrasados = { tipo: "todas" };

function linha(overrides: Partial<LinhaEmprestimoAtrasado> = {}): LinhaEmprestimoAtrasado {
  return {
    id: overrides.id ?? overrides.identificador ?? "HMS00001",
    identificador: overrides.identificador ?? "HMS00001",
    cliente: overrides.cliente === undefined ? "Cliente A" : overrides.cliente,
    codCli: overrides.codCli === undefined ? "C1" : overrides.codCli,
    numPed: overrides.numPed ?? "1120",
    codCar: overrides.codCar ?? 500,
    codRep: overrides.codRep === undefined ? 17 : overrides.codRep,
    emprestimoVenceEm:
      overrides.emprestimoVenceEm === undefined ? UM_MS_ANTES : overrides.emprestimoVenceEm,
    custodia: overrides.custodia ?? "CLIENTE",
    motivoBaixa: overrides.motivoBaixa === undefined ? null : overrides.motivoBaixa,
    baixadoEm: overrides.baixadoEm === undefined ? null : overrides.baixadoEm,
    convertedToContainerId:
      overrides.convertedToContainerId === undefined ? null : overrides.convertedToContainerId,
    alocacaoEncerradaEm:
      overrides.alocacaoEncerradaEm === undefined ? null : overrides.alocacaoEncerradaEm,
  };
}

describe("selecionarEmprestimosAtrasados", () => {
  it("não inclui o empréstimo no instante exato do vencimento", () => {
    const itens = selecionarEmprestimosAtrasados(
      [linha({ emprestimoVenceEm: NOW })],
      NOW,
      TODAS,
    );
    assert.deepEqual(itens, []);
  });

  it("inclui o empréstimo um milissegundo depois do vencimento", () => {
    const itens = selecionarEmprestimosAtrasados([linha()], NOW, TODAS);
    assert.equal(itens.length, 1);
    assert.equal(itens[0]?.identificador, "HMS00001");
    assert.equal(itens[0]?.emprestimoVenceEm.toISOString(), UM_MS_ANTES.toISOString());
    assert.equal(itens[0]?.cliente, "Cliente A");
  });

  it("deixa de fora venda, troca, alocação encerrada, substituído, baixa e outra custódia", () => {
    const fora = [
      linha({ identificador: "VENDA", motivoBaixa: "VENDA" }),
      linha({ identificador: "TROCA", motivoBaixa: "TROCA" }),
      linha({ identificador: "ENCERRADA", alocacaoEncerradaEm: NOW }),
      linha({ identificador: "SUBSTITUIDO", convertedToContainerId: "novo" }),
      linha({ identificador: "BAIXADO", baixadoEm: NOW }),
      linha({ identificador: "PATIO", custodia: "PATIO" }),
      linha({ identificador: "SEM-DATA", emprestimoVenceEm: null }),
    ];
    const itens = selecionarEmprestimosAtrasados(
      [...fora, linha({ identificador: "OK" })],
      NOW,
      TODAS,
    );
    assert.deepEqual(
      itens.map((item) => item.identificador),
      ["OK"],
    );
  });

  it("mantém a linha quando a foto do pedido não trouxe o cliente", () => {
    const itens = selecionarEmprestimosAtrasados(
      [linha({ cliente: null, codCli: null, codRep: null })],
      NOW,
      TODAS,
    );
    assert.equal(itens.length, 1);
    assert.equal(itens[0]?.cliente, null);
    assert.equal(itens[0]?.codCli, null);
    assert.equal(itens[0]?.codRep, null);
  });

  it("ordena pelo prazo mais antigo e desempatar pelo identificador", () => {
    const recente = new Date("2026-09-01T00:00:00.000Z");
    const antigo = new Date("2026-01-01T00:00:00.000Z");
    const itens = selecionarEmprestimosAtrasados(
      [
        linha({ identificador: "HMS00002", emprestimoVenceEm: recente }),
        linha({ identificador: "HMS00020", emprestimoVenceEm: antigo }),
        linha({ identificador: "HMS00010", emprestimoVenceEm: antigo }),
      ],
      NOW,
      TODAS,
    );
    assert.deepEqual(
      itens.map((item) => item.identificador),
      ["HMS00010", "HMS00020", "HMS00002"],
    );
  });

  it("restringe VENDAS ao codRep e trata 999 como representante concreto", () => {
    const linhas = [
      linha({ identificador: "DO-REP", codRep: 17 }),
      linha({ identificador: "OUTRO", codRep: 18 }),
      linha({ identificador: "SEM", codRep: null }),
      linha({ identificador: "NOVE", codRep: 999 }),
    ];
    const doRep = selecionarEmprestimosAtrasados(linhas, NOW, { tipo: "codRep", codRep: 17 });
    const curinga = selecionarEmprestimosAtrasados(linhas, NOW, { tipo: "codRep", codRep: 999 });
    assert.deepEqual(
      doRep.map((item) => item.identificador),
      ["DO-REP"],
    );
    assert.deepEqual(
      curinga.map((item) => item.identificador),
      ["NOVE"],
    );
  });

  it("devolve lista vazia quando o escopo é nenhum", () => {
    const itens = selecionarEmprestimosAtrasados([linha()], NOW, { tipo: "nenhum" });
    assert.deepEqual(itens, []);
  });
});
