import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { NovoAvisoRepresentante } from "../../../../../src/features/ibc/repositories/AvisoRepresentanteRepository";
import {
  GerarAvisosRepresentanteUseCase,
  type GerarAvisosRepresentanteInput,
} from "../../../../../src/features/ibc/useCases/GerarAvisosRepresentante.use-case";
import { conciliacaoViagem } from "../../../../../src/features/ibc/services/conciliacaoViagem";
import type { FicouNaViagem } from "../../../../../src/features/ibc/services/planejarFechamentoViagem";

const EXPEDICAO = "exp-1";
const EVENTO = "evt-1";
const CONSUMER = "IBC_AVISO_REPRESENTANTE";
const FECHADA_EM = new Date("2026-10-19T00:00:00.000Z");
const VENCIMENTO_ALOCACAO = conciliacaoViagem.vencimento(FECHADA_EM).toISOString();
const PRAZO_MS = 90 * 24 * 60 * 60 * 1000;

type Estado = {
  expedicaoExiste: boolean;
  pedidos: unknown;
  vencimentos: ReadonlyMap<string, string | null>;
  avisos: NovoAvisoRepresentante[];
  processed: string[];
  ordem: string[];
  ibcIdsCarregados: string[][];
};

function estadoBase(over: Partial<Estado> = {}): Estado {
  return {
    expedicaoExiste: true,
    pedidos: [],
    vencimentos: new Map(),
    avisos: [],
    processed: [],
    ordem: [],
    ibcIdsCarregados: [],
    ...over,
  };
}

function erroUnico(): Error {
  return Object.assign(new Error("Unique constraint failed"), { code: "P2002" });
}

function criarUseCase(estado: Estado): GerarAvisosRepresentanteUseCase {
  return new GerarAvisosRepresentanteUseCase({
    executarEmTransacao: async (trabalho) => {
      const avisosAntes = estado.avisos.map((aviso) => ({
        ...aviso,
        itens: aviso.itens.map((item) => ({ ...item })),
      }));
      const processedAntes = [...estado.processed];
      try {
        return await trabalho({
          carregarContexto: async (_expedicaoIbcId, ibcIds) => {
            estado.ordem.push("carregar");
            estado.ibcIdsCarregados.push([...ibcIds]);
            if (!estado.expedicaoExiste) return null;
            return { pedidos: estado.pedidos, vencimentoPorIbcId: estado.vencimentos };
          },
          inserirAvisos: async (avisos) => {
            estado.ordem.push("inserir");
            let inseridos = 0;
            for (const aviso of avisos) {
              const existe = estado.avisos.some(
                (atual) =>
                  atual.expedicaoIbcId === aviso.expedicaoIbcId && atual.numPed === aviso.numPed,
              );
              if (existe) continue;
              estado.avisos.push(aviso);
              inseridos += 1;
            }
            return inseridos;
          },
          marcarProcessado: async (consumerName, eventId) => {
            estado.ordem.push("processado");
            const chave = `${consumerName}:${eventId}`;
            if (estado.processed.includes(chave)) throw erroUnico();
            estado.processed.push(chave);
          },
        });
      } catch (error) {
        estado.avisos = avisosAntes;
        estado.processed = processedAntes;
        throw error;
      }
    },
  });
}

function ficou(
  over: Partial<FicouNaViagem> & Pick<FicouNaViagem, "ibcId" | "modalidade" | "numPed">,
): FicouNaViagem {
  return {
    identificador: over.ibcId,
    codCli: "C1",
    cliente: "Cliente W",
    ...over,
  };
}

function entrada(
  ficaram: readonly FicouNaViagem[],
  eventId = EVENTO,
): GerarAvisosRepresentanteInput {
  return { eventId, expedicaoIbcId: EXPEDICAO, codCar: 39039, ficaram };
}

describe("GerarAvisosRepresentanteUseCase", () => {
  it("dois empréstimos e um incluso avisam só os empréstimos, com o pedido da volta e os 90 dias gravados", async () => {
    const estado = estadoBase({
      pedidos: [
        { numPed: "saida-99", codRep: 7, cliente: "Cliente da Saída" },
        { numPed: "volta-emp", codRep: 42, cliente: "Cliente da Volta" },
        { numPed: "volta-inc", codRep: 99, cliente: "Cliente Incluso" },
      ],
      vencimentos: new Map([
        ["ibc-emp-1", VENCIMENTO_ALOCACAO],
        ["ibc-emp-2", VENCIMENTO_ALOCACAO],
      ]),
    });

    const resultado = await criarUseCase(estado).execute(
      entrada([
        ficou({
          ibcId: "ibc-inc",
          identificador: "HM00001",
          modalidade: "VENDA",
          numPed: "volta-inc",
          cliente: "Cliente Incluso",
        }),
        ficou({
          ibcId: "ibc-emp-1",
          identificador: "HM00002",
          modalidade: "EMPRESTIMO",
          numPed: "volta-emp",
          cliente: "Cliente da Volta",
        }),
        ficou({
          ibcId: "ibc-emp-2",
          identificador: "HM00003",
          modalidade: "EMPRESTIMO",
          numPed: "volta-emp",
          cliente: "Cliente da Volta",
        }),
      ]),
    );

    assert.equal(resultado.inseridos, 1);
    assert.equal(estado.avisos.length, 1);
    assert.equal(estado.avisos[0]?.numPed, "volta-emp");
    assert.equal(estado.avisos[0]?.codRep, 42);
    assert.equal(estado.avisos[0]?.cliente, "Cliente da Volta");
    assert.deepEqual(
      estado.avisos[0]?.itens.map((item) => item.identificador),
      ["HM00002", "HM00003"],
    );
    assert.deepEqual(
      estado.avisos[0]?.itens.map((item) => item.modalidade),
      ["EMPRESTIMO", "EMPRESTIMO"],
    );
    assert.deepEqual(
      estado.avisos[0]?.itens.map((item) => item.emprestimoVenceEm),
      [VENCIMENTO_ALOCACAO, VENCIMENTO_ALOCACAO],
    );
    assert.equal(new Date(VENCIMENTO_ALOCACAO).getTime() - FECHADA_EM.getTime(), PRAZO_MS);
    assert.equal(
      estado.avisos[0]?.itens.some((item) => item.modalidade === "VENDA"),
      false,
    );
    assert.deepEqual(estado.ibcIdsCarregados, [["ibc-emp-1", "ibc-emp-2"]]);
    assert.deepEqual(estado.ordem, ["carregar", "inserir", "processado"]);
    assert.deepEqual(estado.processed, [`${CONSUMER}:${EVENTO}`]);
  });

  it("só incluso grava o ProcessedEvent e não gera aviso", async () => {
    const estado = estadoBase({
      pedidos: [{ numPed: "volta-inc", codRep: 99, cliente: "Cliente Incluso" }],
    });

    const resultado = await criarUseCase(estado).execute(
      entrada([
        ficou({ ibcId: "ibc-inc", identificador: "HM00001", modalidade: "VENDA", numPed: "volta-inc" }),
      ]),
    );

    assert.deepEqual(resultado, { inseridos: 0 });
    assert.equal(estado.avisos.length, 0);
    assert.deepEqual(estado.processed, [`${CONSUMER}:${EVENTO}`]);
  });

  it("ficaram vazio grava só o ProcessedEvent", async () => {
    const estado = estadoBase({
      pedidos: [{ numPed: "100", codRep: 42 }],
    });

    const resultado = await criarUseCase(estado).execute(entrada([]));

    assert.deepEqual(resultado, { inseridos: 0 });
    assert.equal(estado.avisos.length, 0);
    assert.deepEqual(estado.ordem, ["processado"]);
    assert.deepEqual(estado.processed, [`${CONSUMER}:${EVENTO}`]);
  });

  it("replay do mesmo eventId não cria outro aviso", async () => {
    const estado = estadoBase({
      pedidos: [{ numPed: "100", codRep: 42 }],
    });
    const useCase = criarUseCase(estado);
    const ficaram = [
      ficou({ ibcId: "ibc-emp", modalidade: "EMPRESTIMO", numPed: "100" }),
    ];

    await useCase.execute(entrada(ficaram));
    const segundo = await useCase.execute(entrada(ficaram));

    assert.deepEqual(segundo, { inseridos: 0 });
    assert.equal(estado.avisos.length, 1);
    assert.deepEqual(estado.processed, [`${CONSUMER}:${EVENTO}`]);
  });

  it("pula pedido sem codRep válido, registra o numPed e segue com os demais", async () => {
    const estado = estadoBase({
      pedidos: [
        { numPed: "100", codRep: 15 },
        { numPed: "200" },
        { numPed: "300", codRep: 0 },
      ],
      vencimentos: new Map([["ibc-sem", VENCIMENTO_ALOCACAO]]),
    });
    const avisos: string[] = [];
    const original = console.warn;
    console.warn = (...args: unknown[]) => {
      avisos.push(args.map((parte) => String(parte)).join(" "));
    };

    try {
      const resultado = await criarUseCase(estado).execute(
        entrada([
          ficou({ ibcId: "ibc-ok", modalidade: "EMPRESTIMO", numPed: "100" }),
          ficou({ ibcId: "ibc-sem", modalidade: "EMPRESTIMO", numPed: "200" }),
          ficou({ ibcId: "ibc-zero", modalidade: "EMPRESTIMO", numPed: "300" }),
          ficou({ ibcId: "ibc-inc", modalidade: "VENDA", numPed: "400" }),
        ]),
      );
      assert.equal(resultado.inseridos, 1);
    } finally {
      console.warn = original;
    }

    assert.deepEqual(
      estado.avisos.map((aviso) => aviso.numPed),
      ["100"],
    );
    assert.equal(estado.processed.length, 1);
    assert.ok(avisos.some((linha) => linha.includes("200")));
    assert.ok(avisos.some((linha) => linha.includes("300")));
    assert.equal(avisos.some((linha) => linha.includes("400")), false);
  });

  it("expedição ausente não marca o evento como processado", async () => {
    const estado = estadoBase({ expedicaoExiste: false });

    await assert.rejects(() =>
      criarUseCase(estado).execute(
        entrada([ficou({ ibcId: "ibc-1", modalidade: "EMPRESTIMO", numPed: "100" })]),
      ),
    );

    assert.equal(estado.avisos.length, 0);
    assert.equal(estado.processed.length, 0);
  });
});
