import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { Role } from "@prisma/client";
import {
  RegistrarIbcInspecaoInput,
  RegistrarIbcInspecaoUseCase,
} from "../../../../../src/features/ibc/useCases/RegistrarIbcInspecao.use-case";
import {
  CreateIbcInspecaoData,
  IIbcInspecaoRepository,
} from "../../../../../src/features/ibc/repositories/IIbcInspecaoRepository";
import { IbcCadastroRecord } from "../../../../../src/features/ibc/types/IbcCadastro.types";
import {
  IbcAlocacaoAberta,
  IbcChecklistParaInspecao,
} from "../../../../../src/features/ibc/types/IbcInspecao.types";
import { AppError } from "../../../../../src/utils/AppError";

const NOW = new Date("2026-10-09T12:00:00.000Z");

const ibcBase: IbcCadastroRecord = {
  id: "ibc-1",
  identificador: "HMS00001",
  tipoCadastro: "NOVO",
  aptidao: "APTO",
  motivoInaptidao: null,
  custodia: "PATIO",
  dataLimite: new Date("2030-01-01T00:00:00.000Z"),
  primeiraInspecaoEm: null,
  baixadoEm: null,
  createdAt: new Date("2026-10-01T00:00:00.000Z"),
};

const soda: IbcChecklistParaInspecao = {
  ativo: true,
  notaMinimaCritico: 7,
  mediaMinima: 6,
  itensAtivos: [
    { checklistItemId: "valvula", descricao: "Válvula", critico: true },
    { checklistItemId: "tampa", descricao: "Tampa", critico: false },
    { checklistItemId: "grade", descricao: "Grade", critico: false },
  ],
};

type SetupOptions = {
  ibc?: IbcCadastroRecord | null;
  checklists?: Record<string, IbcChecklistParaInspecao>;
  alocacao?: IbcAlocacaoAberta | null;
};

function setup(options: SetupOptions = {}) {
  const ibc = options.ibc === undefined ? { ...ibcBase } : options.ibc;
  const checklists = options.checklists ?? { soda, estrutural: { ...soda } };
  const gravadas: CreateIbcInspecaoData[] = [];

  const ibcs = {
    async findById() {
      return ibc;
    },
  };
  const repository: IIbcInspecaoRepository = {
    async findChecklistVinculado(_ibcId, checklistModeloId) {
      return checklists[checklistModeloId] ?? null;
    },
    async findAlocacaoAberta() {
      return options.alocacao ?? null;
    },
    async registrar(data, recalcular) {
      if (!ibc) throw new Error("IBC ausente no repositório em memória");
      gravadas.push(data);
      const ultimas = new Map(gravadas.map((g) => [g.checklistModeloId, g.resultado]));
      const atualizacao = recalcular({
        motivoInaptidao: ibc.motivoInaptidao,
        dataLimite: ibc.dataLimite,
        primeiraInspecaoEm: ibc.primeiraInspecaoEm,
        ultimasPorChecklistVinculado: [...ultimas.values()],
      });
      Object.assign(ibc, atualizacao);
      return {
        inspecao: {
          ...data,
          id: `insp-${gravadas.length}`,
          inspecionadoEm: data.inspecionadoEm.toISOString(),
        },
        ibc: {
          aptidao: atualizacao.aptidao,
          motivoInaptidao: atualizacao.motivoInaptidao,
          primeiraInspecaoEm: atualizacao.primeiraInspecaoEm?.toISOString() ?? null,
        },
      };
    },
  };

  return {
    useCase: new RegistrarIbcInspecaoUseCase(ibcs, repository, () => NOW),
    gravadas,
    ibc,
  };
}

function hasCode(code: string, statusCode: number) {
  return (error: unknown) =>
    error instanceof AppError && error.code === code && error.statusCode === statusCode;
}

function input(overrides: Partial<RegistrarIbcInspecaoInput> = {}): RegistrarIbcInspecaoInput {
  return {
    actorRole: Role.ALMOX,
    actorId: "user-9",
    ibcId: "ibc-1",
    checklistModeloId: "soda",
    respostas: [
      { checklistItemId: "valvula", nota: 8 },
      { checklistItemId: "tampa", nota: 7 },
      { checklistItemId: "grade", nota: 6 },
    ],
    ...overrides,
  };
}

const reprovadas = [
  { checklistItemId: "valvula", nota: 3 },
  { checklistItemId: "tampa", nota: 10 },
  { checklistItemId: "grade", nota: 10 },
];

describe("RegistrarIbcInspecaoUseCase — recusas", () => {
  it("recusa papel sem escrita com 403", async () => {
    const { useCase } = setup();
    await assert.rejects(
      () => useCase.execute(input({ actorRole: Role.LOGISTICA })),
      hasCode("IBC_CHECKLIST_FORBIDDEN", 403),
    );
  });

  it("recusa IBC inexistente com 404 IBC_NOT_FOUND", async () => {
    const { useCase } = setup({ ibc: null });
    await assert.rejects(() => useCase.execute(input()), hasCode("IBC_NOT_FOUND", 404));
  });

  it("recusa IBC baixado com 404 IBC_NOT_FOUND", async () => {
    const { useCase } = setup({ ibc: { ...ibcBase, baixadoEm: NOW } });
    await assert.rejects(() => useCase.execute(input()), hasCode("IBC_NOT_FOUND", 404));
  });

  it("recusa IBC Em viagem com 409 IBC_EM_VIAGEM", async () => {
    const { useCase } = setup({ ibc: { ...ibcBase, custodia: "EM_VIAGEM" } });
    await assert.rejects(() => useCase.execute(input()), hasCode("IBC_EM_VIAGEM", 409));
  });

  it("recusa checklist não vinculado com 422 IBC_CHECKLIST_NAO_VINCULADO", async () => {
    const { useCase } = setup();
    await assert.rejects(
      () => useCase.execute(input({ checklistModeloId: "outro" })),
      hasCode("IBC_CHECKLIST_NAO_VINCULADO", 422),
    );
  });

  it("recusa checklist inativo com 422 IBC_CHECKLIST_INATIVO", async () => {
    const { useCase } = setup({ checklists: { soda: { ...soda, ativo: false } } });
    await assert.rejects(() => useCase.execute(input()), hasCode("IBC_CHECKLIST_INATIVO", 422));
  });

  it("recusa quando falta nota de item ativo", async () => {
    const { useCase } = setup();
    await assert.rejects(
      () => useCase.execute(input({ respostas: [{ checklistItemId: "valvula", nota: 8 }] })),
      hasCode("IBC_INSPECAO_RESPOSTAS_INCOMPLETAS", 422),
    );
  });

  it("recusa item estranho ou inativo nas respostas", async () => {
    const { useCase } = setup();
    const respostas = [...input().respostas, { checklistItemId: "item-inativo", nota: 9 }];
    await assert.rejects(
      () => useCase.execute(input({ respostas })),
      hasCode("IBC_INSPECAO_RESPOSTAS_INCOMPLETAS", 422),
    );
  });

  it("recusa item duplicado nas respostas", async () => {
    const { useCase } = setup();
    const respostas = [...input().respostas, { checklistItemId: "tampa", nota: 2 }];
    await assert.rejects(
      () => useCase.execute(input({ respostas })),
      hasCode("IBC_INSPECAO_RESPOSTAS_INCOMPLETAS", 422),
    );
  });

  it("aplica a precedência: permissão antes de IBC inexistente", async () => {
    const { useCase } = setup({ ibc: null });
    await assert.rejects(
      () => useCase.execute(input({ actorRole: Role.VENDAS })),
      hasCode("IBC_CHECKLIST_FORBIDDEN", 403),
    );
  });

  it("aplica a precedência: IBC baixado antes de Em viagem", async () => {
    const { useCase } = setup({ ibc: { ...ibcBase, baixadoEm: NOW, custodia: "EM_VIAGEM" } });
    await assert.rejects(() => useCase.execute(input()), hasCode("IBC_NOT_FOUND", 404));
  });

  it("aplica a precedência: Em viagem antes de checklist não vinculado e respostas incompletas", async () => {
    const { useCase } = setup({ ibc: { ...ibcBase, custodia: "EM_VIAGEM" } });
    await assert.rejects(
      () => useCase.execute(input({ checklistModeloId: "outro", respostas: [] })),
      hasCode("IBC_EM_VIAGEM", 409),
    );
  });

  it("aplica a precedência: checklist inativo antes de respostas incompletas", async () => {
    const { useCase } = setup({ checklists: { soda: { ...soda, ativo: false } } });
    await assert.rejects(
      () => useCase.execute(input({ respostas: [] })),
      hasCode("IBC_CHECKLIST_INATIVO", 422),
    );
  });

  it("não grava nada quando recusa", async () => {
    const { useCase, gravadas } = setup();
    await assert.rejects(() => useCase.execute(input({ respostas: [] })));
    assert.equal(gravadas.length, 0);
  });
});

describe("RegistrarIbcInspecaoUseCase — registro e aptidão", () => {
  it("grava a inspeção aprovada com snapshots de limites, média e itens", async () => {
    const { useCase, gravadas } = setup();
    await useCase.execute(input({ observacao: "ok" }));

    assert.deepEqual(gravadas, [
      {
        ibcId: "ibc-1",
        checklistModeloId: "soda",
        resultado: "APROVADA",
        mediaObtida: 6.5,
        notaMinimaCritico: 7,
        mediaMinima: 6,
        inspetorId: "user-9",
        inspecionadoEm: NOW,
        observacao: "ok",
        respostas: [
          { checklistItemId: "valvula", descricao: "Válvula", critico: true, nota: 8 },
          { checklistItemId: "tampa", descricao: "Tampa", critico: false, nota: 7 },
          { checklistItemId: "grade", descricao: "Grade", critico: false, nota: 6 },
        ],
      },
    ]);
  });

  it("primeira aprovada deixa o IBC APTO e grava primeiraInspecaoEm", async () => {
    const { useCase } = setup();
    const result = await useCase.execute(input());

    assert.equal(result.inspecao.resultado, "APROVADA");
    assert.deepEqual(result.ibc, {
      aptidao: "APTO",
      motivoInaptidao: null,
      primeiraInspecaoEm: NOW.toISOString(),
    });
    assert.equal(result.aviso, undefined);
  });

  it("reprovada torna INAPTO por INSPECAO_REPROVADA e não grava primeiraInspecaoEm", async () => {
    const { useCase } = setup();
    const result = await useCase.execute(input({ respostas: reprovadas }));

    assert.equal(result.inspecao.resultado, "REPROVADA");
    assert.deepEqual(result.ibc, {
      aptidao: "INAPTO",
      motivoInaptidao: "INSPECAO_REPROVADA",
      primeiraInspecaoEm: null,
    });
  });

  it("não sobrescreve primeiraInspecaoEm em aprovações seguintes", async () => {
    const primeira = new Date("2026-10-01T09:00:00.000Z");
    const { useCase } = setup({ ibc: { ...ibcBase, primeiraInspecaoEm: primeira } });
    const result = await useCase.execute(input());

    assert.equal(result.ibc.primeiraInspecaoEm, primeira.toISOString());
  });

  it("reinspeção aprovada após reprovada devolve APTO", async () => {
    const { useCase } = setup();
    await useCase.execute(input({ respostas: reprovadas }));
    const result = await useCase.execute(input());

    assert.equal(result.ibc.aptidao, "APTO");
    assert.equal(result.ibc.motivoInaptidao, null);
  });

  it("mantém INAPTO por DATA_LIMITE quando a data limite vence agora, mesmo aprovada", async () => {
    const { useCase } = setup({ ibc: { ...ibcBase, dataLimite: NOW } });
    const result = await useCase.execute(input());

    assert.equal(result.inspecao.resultado, "APROVADA");
    assert.equal(result.ibc.aptidao, "INAPTO");
    assert.equal(result.ibc.motivoInaptidao, "DATA_LIMITE");
  });

  it("mantém INAPTO por DATA_LIMITE já marcado, mesmo aprovada", async () => {
    const { useCase } = setup({
      ibc: { ...ibcBase, aptidao: "INAPTO", motivoInaptidao: "DATA_LIMITE" },
    });
    const result = await useCase.execute(input());

    assert.equal(result.ibc.aptidao, "INAPTO");
    assert.equal(result.ibc.motivoInaptidao, "DATA_LIMITE");
  });

  it("aprovada limpa AGUARDANDO_INSPECAO", async () => {
    const { useCase } = setup({
      ibc: { ...ibcBase, aptidao: "INAPTO", motivoInaptidao: "AGUARDANDO_INSPECAO" },
    });
    const result = await useCase.execute(input());

    assert.equal(result.ibc.aptidao, "APTO");
    assert.equal(result.ibc.motivoInaptidao, null);
  });

  it("avisa IBC_ALOCADO_INAPTO quando reprova IBC com alocação aberta", async () => {
    const { useCase } = setup({ alocacao: { codCar: 4521, numPed: "77810" } });
    const result = await useCase.execute(input({ respostas: reprovadas }));

    assert.deepEqual(result.aviso, { code: "IBC_ALOCADO_INAPTO", codCar: 4521, numPed: "77810" });
  });

  it("não avisa quando aprova IBC com alocação aberta", async () => {
    const { useCase } = setup({ alocacao: { codCar: 4521, numPed: "77810" } });
    const result = await useCase.execute(input());

    assert.equal(result.aviso, undefined);
  });
});
