import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { Prisma, Role } from "@prisma/client";
import {
  AbrirEntradaPatioInput,
  AbrirEntradaPatioUseCase,
} from "../../../../../src/features/ibc/useCases/AbrirEntradaPatio.use-case";
import { ListIbcPoolUseCase } from "../../../../../src/features/ibc/useCases/ListIbcPool.use-case";
import { IIbcEntradaPatioRepository } from "../../../../../src/features/ibc/repositories/IIbcEntradaPatioRepository";
import { IIbcCadastroRepository } from "../../../../../src/features/ibc/repositories/IIbcCadastroRepository";
import { IbcCadastroRecord } from "../../../../../src/features/ibc/types/IbcCadastro.types";
import {
  AbrirEntradaPersistencia,
  IbcParaAbrirEntrada,
} from "../../../../../src/features/ibc/types/IbcEntradaPatio.types";
import { AppError } from "../../../../../src/utils/AppError";

const NOW = new Date("2026-10-13T15:00:00.000Z");

const ibcBase: IbcParaAbrirEntrada = {
  id: "ibc-1",
  identificador: "HMS00001",
  baixadoEm: null,
  custodia: "EM_VIAGEM",
  aptidao: "APTO",
  motivoInaptidao: null,
  dataLimite: new Date("2030-01-01T00:00:00.000Z"),
  tipoCadastro: "NOVO",
  aquisicao: "COMPRA",
};

type RepoState = {
  ibc?: IbcParaAbrirEntrada | null;
  jaPendente?: boolean;
};

function setup(state: RepoState = {}) {
  const seenDb: Array<Prisma.TransactionClient | undefined> = [];
  const gravadas: AbrirEntradaPersistencia[] = [];
  const ibc = state.ibc === undefined ? { ...ibcBase } : state.ibc;
  const repository = {
    async abrir(_ibcId, decidir, db) {
      seenDb.push(db);
      const data = decidir(ibc, state.jaPendente === true);
      gravadas.push(data);
      return {
        id: "entrada-1",
        ibcId: data.origem ? "ibc-1" : "ibc-1",
        identificador: ibc?.identificador ?? "",
        origem: data.origem,
        status: "PENDENTE",
        abertoEm: data.abertoEm,
        custodia: "ENTRADA",
        aptidao: "INAPTO",
        motivoInaptidao: data.motivoInaptidao,
      };
    },
    async listPendentes() {
      return [];
    },
    async concluir() {
      throw new Error("concluir não entra na abertura");
    },
  } as IIbcEntradaPatioRepository;
  return {
    useCase: new AbrirEntradaPatioUseCase(repository, () => NOW),
    gravadas,
    seenDb,
  };
}

function input(overrides: Partial<AbrirEntradaPatioInput> = {}): AbrirEntradaPatioInput {
  return { actorRole: Role.ALMOX, actorId: "user-1", ibcId: "ibc-1", origem: "RETORNO", ...overrides };
}

function hasCode(code: string, statusCode: number) {
  return (error: unknown) => error instanceof AppError && error.code === code && error.statusCode === statusCode;
}

describe("AbrirEntradaPatioUseCase", () => {
  it("abre retorno de IBC Em viagem como ENTRADA aguardando inspeção", async () => {
    const { useCase, gravadas } = setup();
    const entrada = await useCase.execute(input());
    assert.equal(entrada.custodia, "ENTRADA");
    assert.equal(entrada.aptidao, "INAPTO");
    assert.equal(entrada.motivoInaptidao, "AGUARDANDO_INSPECAO");
    assert.equal(entrada.origem, "RETORNO");
    assert.equal(gravadas[0]?.abertoPorId, "user-1");
    assert.equal(gravadas[0]?.abertoEm.toISOString(), NOW.toISOString());
  });

  it("repassa a transação do chamador para o Fechar Viagem", async () => {
    const { useCase, seenDb } = setup();
    const db = { marker: "tx-38" } as unknown as Prisma.TransactionClient;
    await useCase.execute(input(), db);
    assert.equal(seenDb[0], db);
  });

  it("abre o #in da Troca que ainda está no pátio", async () => {
    const { useCase } = setup({
      ibc: { ...ibcBase, custodia: "PATIO", aquisicao: "TROCA", tipoCadastro: "TROCA" },
    });
    const entrada = await useCase.execute(input({ origem: "TROCA" }));
    assert.equal(entrada.origem, "TROCA");
    assert.equal(entrada.motivoInaptidao, "AGUARDANDO_INSPECAO");
  });

  it("aceita Troca pelo tipoCadastro mesmo com aquisição de compra", async () => {
    const { useCase } = setup({
      ibc: { ...ibcBase, custodia: "PATIO", aquisicao: "COMPRA", tipoCadastro: "TROCA" },
    });
    const entrada = await useCase.execute(input({ origem: "TROCA" }));
    assert.equal(entrada.origem, "TROCA");
  });

  it("preserva DATA_LIMITE quando o prazo já venceu", async () => {
    const { useCase } = setup({
      ibc: { ...ibcBase, dataLimite: new Date("2020-01-01T00:00:00.000Z") },
    });
    const entrada = await useCase.execute(input());
    assert.equal(entrada.motivoInaptidao, "DATA_LIMITE");
  });

  it("recusa papel sem escrita", async () => {
    const { useCase } = setup();
    await assert.rejects(() => useCase.execute(input({ actorRole: Role.LOGISTICA })), hasCode("IBC_ENTRADA_FORBIDDEN", 403));
  });

  it("recusa IBC ausente ou baixado", async () => {
    const missing = setup({ ibc: null });
    await assert.rejects(() => missing.useCase.execute(input()), hasCode("IBC_NOT_FOUND", 404));
    const baixado = setup({ ibc: { ...ibcBase, baixadoEm: NOW } });
    await assert.rejects(() => baixado.useCase.execute(input()), hasCode("IBC_NOT_FOUND", 404));
  });

  it("recusa segunda entrada pendente", async () => {
    const { useCase } = setup({ jaPendente: true });
    await assert.rejects(() => useCase.execute(input()), hasCode("IBC_ENTRADA_JA_ABERTA", 409));
  });

  it("recusa retorno que não está Em viagem", async () => {
    const { useCase } = setup({ ibc: { ...ibcBase, custodia: "PATIO" } });
    await assert.rejects(() => useCase.execute(input()), hasCode("IBC_NAO_EM_VIAGEM", 409));
  });

  it("recusa Troca de um IBC que não é troca", async () => {
    const { useCase } = setup({ ibc: { ...ibcBase, custodia: "PATIO" } });
    await assert.rejects(() => useCase.execute(input({ origem: "TROCA" })), hasCode("IBC_ENTRADA_NAO_E_TROCA", 422));
  });

  it("recusa Troca que não está no pátio", async () => {
    const { useCase } = setup({
      ibc: { ...ibcBase, custodia: "EM_VIAGEM", aquisicao: "TROCA" },
    });
    await assert.rejects(
      () => useCase.execute(input({ origem: "TROCA" })),
      hasCode("IBC_ENTRADA_CUSTODIA_INVALIDA", 409),
    );
  });
});

describe("ListIbcPoolUseCase — entrada pendente", () => {
  it("tira o IBC em ENTRADA do pool, inclusive da listagem com baixados", async () => {
    const entrada: IbcCadastroRecord = {
      id: "ibc-entrada",
      identificador: "HMS00009",
      tipoCadastro: "NOVO",
      aptidao: "INAPTO",
      motivoInaptidao: "AGUARDANDO_INSPECAO",
      custodia: "ENTRADA",
      dataLimite: new Date("2030-01-01T00:00:00.000Z"),
      primeiraInspecaoEm: null,
      baixadoEm: null,
      createdAt: NOW,
    };
    const patio: IbcCadastroRecord = { ...entrada, id: "ibc-patio", identificador: "HMS00008", custodia: "PATIO", aptidao: "APTO", motivoInaptidao: null };
    const repo = {
      async listActiveIbcs() {
        return [entrada, patio];
      },
      async listIbcs() {
        return [entrada, patio];
      },
      async markDataLimite(id: string) {
        return id === patio.id ? patio : entrada;
      },
    } as unknown as IIbcCadastroRepository;

    const useCase = new ListIbcPoolUseCase(repo);
    const pool = await useCase.execute();
    const audit = await useCase.execute({ incluirBaixados: true });
    assert.deepEqual(pool.map((ibc) => ibc.identificador), ["HMS00008"]);
    assert.deepEqual(audit.map((ibc) => ibc.identificador), ["HMS00008"]);
  });
});
