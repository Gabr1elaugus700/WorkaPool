import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { Prisma, Role } from "@prisma/client";
import { ConcluirEntradaPatioUseCase } from "../../../../../src/features/ibc/useCases/ConcluirEntradaPatio.use-case";
import { ListEntradasPatioPendentesUseCase } from "../../../../../src/features/ibc/useCases/ListEntradasPatioPendentes.use-case";
import { IIbcEntradaPatioRepository } from "../../../../../src/features/ibc/repositories/IIbcEntradaPatioRepository";
import {
  ConclusaoEntradaPersistencia,
  EntradaParaConcluir,
  EntradaPatioFilaItem,
} from "../../../../../src/features/ibc/types/IbcEntradaPatio.types";
import { AppError } from "../../../../../src/utils/AppError";

const NOW = new Date("2026-10-13T18:00:00.000Z");

const entradaBase: EntradaParaConcluir = {
  id: "entrada-1",
  ibcId: "ibc-1",
  identificador: "HMS00001",
  baixadoEm: null,
  dataLimite: new Date("2030-01-01T00:00:00.000Z"),
  motivoInaptidao: "AGUARDANDO_INSPECAO",
  checklistsAtivos: [
    { checklistModeloId: "soda", nome: "Checklist Soda" },
    { checklistModeloId: "estrutura", nome: "Estrutural" },
  ],
  inspecoes: [
    { checklistModeloId: "soda", resultado: "APROVADA", inspecionadoEm: new Date("2026-10-13T16:00:00.000Z") },
    { checklistModeloId: "estrutura", resultado: "APROVADA", inspecionadoEm: new Date("2026-10-13T16:05:00.000Z") },
  ],
};

function setup(entrada: EntradaParaConcluir | null) {
  const gravadas: ConclusaoEntradaPersistencia[] = [];
  const seenDb: Array<Prisma.TransactionClient | undefined> = [];
  const repository = {
    async abrir() {
      throw new Error("abrir não entra na conclusão");
    },
    async listPendentes() {
      return [];
    },
    async concluir(_ibcId, decidir, db) {
      seenDb.push(db);
      const data = decidir(entrada);
      gravadas.push(data);
      return {
        id: data.entradaId,
        ibcId: entrada?.ibcId ?? "",
        identificador: entrada?.identificador ?? "",
        custodia: "PATIO" as const,
        aptidao: data.aptidao,
        motivoInaptidao: data.motivoInaptidao,
        concluidoEm: data.concluidoEm,
      };
    },
  } as IIbcEntradaPatioRepository;
  return {
    useCase: new ConcluirEntradaPatioUseCase(repository, () => NOW),
    gravadas,
    seenDb,
  };
}

function hasCode(code: string, statusCode: number) {
  return (error: unknown) => error instanceof AppError && error.code === code && error.statusCode === statusCode;
}

describe("ConcluirEntradaPatioUseCase", () => {
  it("conclui com todas aprovadas em PATIO e Apto", async () => {
    const { useCase, gravadas } = setup(entradaBase);
    const result = await useCase.execute({ actorRole: Role.ADMIN, actorId: "user-2", ibcId: "ibc-1" });
    assert.equal(result.custodia, "PATIO");
    assert.equal(result.aptidao, "APTO");
    assert.equal(result.motivoInaptidao, null);
    assert.equal(gravadas[0]?.concluidoPorId, "user-2");
    assert.equal(gravadas[0]?.entradaId, "entrada-1");
  });

  it("fica Inapto quando alguma inspeção desta entrada foi reprovada", async () => {
    const { useCase } = setup({
      ...entradaBase,
      inspecoes: [
        { checklistModeloId: "soda", resultado: "REPROVADA", inspecionadoEm: NOW },
        entradaBase.inspecoes[1],
      ],
    });
    const result = await useCase.execute({ actorRole: Role.ALMOX, actorId: "user-2", ibcId: "ibc-1" });
    assert.equal(result.custodia, "PATIO");
    assert.equal(result.aptidao, "INAPTO");
    assert.equal(result.motivoInaptidao, "INSPECAO_REPROVADA");
  });

  it("usa a inspeção mais recente do checklist", async () => {
    const { useCase } = setup({
      ...entradaBase,
      inspecoes: [
        { checklistModeloId: "soda", resultado: "REPROVADA", inspecionadoEm: new Date("2026-10-13T16:00:00.000Z") },
        { checklistModeloId: "soda", resultado: "APROVADA", inspecionadoEm: new Date("2026-10-13T17:00:00.000Z") },
        entradaBase.inspecoes[1],
      ],
    });
    const result = await useCase.execute({ actorRole: Role.ALMOX, actorId: "user-2", ibcId: "ibc-1" });
    assert.equal(result.aptidao, "APTO");
  });

  it("DATA_LIMITE prevalece sobre inspeções aprovadas", async () => {
    const { useCase } = setup({
      ...entradaBase,
      dataLimite: new Date("2020-01-01T00:00:00.000Z"),
    });
    const result = await useCase.execute({ actorRole: Role.ALMOX, actorId: "user-2", ibcId: "ibc-1" });
    assert.equal(result.aptidao, "INAPTO");
    assert.equal(result.motivoInaptidao, "DATA_LIMITE");
  });

  it("recusa sem checklist ativo vinculado", async () => {
    const { useCase } = setup({ ...entradaBase, checklistsAtivos: [], inspecoes: [] });
    await assert.rejects(
      () => useCase.execute({ actorRole: Role.ALMOX, actorId: "user-2", ibcId: "ibc-1" }),
      hasCode("IBC_ENTRADA_SEM_CHECKLIST", 422),
    );
  });

  it("recusa checklist ativo sem inspeção desta entrada", async () => {
    const { useCase } = setup({
      ...entradaBase,
      inspecoes: [entradaBase.inspecoes[0]],
    });
    await assert.rejects(
      () => useCase.execute({ actorRole: Role.ALMOX, actorId: "user-2", ibcId: "ibc-1" }),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.equal(error.code, "IBC_ENTRADA_INSPECAO_PENDENTE");
        const details = error.details as { faltantes: Array<{ checklistModeloId: string }> };
        assert.deepEqual(details.faltantes.map((item) => item.checklistModeloId), ["estrutura"]);
        return true;
      },
    );
  });

  it("recusa quando não há entrada pendente", async () => {
    const { useCase } = setup(null);
    await assert.rejects(
      () => useCase.execute({ actorRole: Role.ALMOX, actorId: "user-2", ibcId: "ibc-1" }),
      hasCode("IBC_ENTRADA_NAO_ENCONTRADA", 404),
    );
  });

  it("recusa IBC baixado", async () => {
    const { useCase } = setup({ ...entradaBase, baixadoEm: NOW });
    await assert.rejects(
      () => useCase.execute({ actorRole: Role.ALMOX, actorId: "user-2", ibcId: "ibc-1" }),
      hasCode("IBC_NOT_FOUND", 404),
    );
  });

  it("recusa papel sem escrita e repassa a transação", async () => {
    const { useCase, seenDb } = setup(entradaBase);
    await assert.rejects(
      () => useCase.execute({ actorRole: Role.LOGISTICA, actorId: "user-2", ibcId: "ibc-1" }),
      hasCode("IBC_ENTRADA_FORBIDDEN", 403),
    );
    const db = { marker: "tx" } as unknown as Prisma.TransactionClient;
    await useCase.execute({ actorRole: Role.ALMOX, actorId: "user-2", ibcId: "ibc-1" }, db);
    assert.equal(seenDb[0], db);
  });
});

describe("ListEntradasPatioPendentesUseCase", () => {
  it("lista a fila para ALMOX e recusa outros papéis", async () => {
    const fila: EntradaPatioFilaItem[] = [
      {
        id: "entrada-1",
        ibcId: "ibc-1",
        identificador: "HMS00001",
        origem: "RETORNO",
        abertoEm: NOW,
        motivoInaptidao: "AGUARDANDO_INSPECAO",
        checklists: [{ checklistModeloId: "soda", nome: "Checklist Soda", inspecionada: false }],
      },
    ];
    const repository = {
      async listPendentes() {
        return fila;
      },
    } as Pick<IIbcEntradaPatioRepository, "listPendentes">;
    const useCase = new ListEntradasPatioPendentesUseCase(repository);
    assert.equal(await useCase.execute(Role.ALMOX), fila);
    await assert.rejects(() => useCase.execute(Role.LOGISTICA), hasCode("IBC_ENTRADA_FORBIDDEN", 403));
  });
});
