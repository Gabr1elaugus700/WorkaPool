import assert from "node:assert/strict";
import { describe, it } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { IbcChecklistSummaryDTO, IbcChecklistVinculoDTO } from "../types/ibcChecklist.types";
import CadastroIbcChecklists from "./CadastroIbcChecklists";

const VINCULO: IbcChecklistVinculoDTO = {
  checklistModeloId: "chk-1",
  nome: "Entrada padrão",
  ativo: true,
  vinculadoEm: "2026-11-01T12:00:00.000Z",
  vinculadoPor: { id: "u1", nome: "Almox" },
};

const DISPONIVEL: IbcChecklistSummaryDTO = {
  id: "chk-2",
  nome: "Outro checklist",
  notaMinimaCritico: 7,
  mediaMinima: 7,
  ativo: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  totalItens: 2,
};

function html(canWrite: boolean, vinculos: IbcChecklistVinculoDTO[]): string {
  return renderToStaticMarkup(
    React.createElement(CadastroIbcChecklists, {
      canWrite,
      vinculos,
      checklists: canWrite ? [DISPONIVEL] : [],
      submitting: false,
      pendingChecklistId: null,
      onVincular: async () => true,
      onDesvincular: async () => true,
    }),
  );
}

describe("checklists na edição do container", () => {
  it("com escrita mostra o vínculo, vincular e desvincular", () => {
    const markup = html(true, [VINCULO]);
    assert.match(markup, /Entrada padrão/);
    assert.match(markup, /Vincular/);
    assert.match(markup, /Desvincular/);
  });

  it("sem escrita mostra o vínculo sem ações", () => {
    const markup = html(false, [VINCULO]);
    assert.match(markup, /Entrada padrão/);
    assert.doesNotMatch(markup, /Vincular/);
    assert.doesNotMatch(markup, /Desvincular/);
  });

  it("lista vazia avisa que não há checklist vinculado", () => {
    const markup = html(false, []);
    assert.match(markup, /Nenhum checklist vinculado/);
  });
});
