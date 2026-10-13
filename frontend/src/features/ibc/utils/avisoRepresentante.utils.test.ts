import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { avisoRepresentanteLabels } from "./avisoRepresentante.utils";

describe("avisoRepresentanteLabels", () => {
  it("labels a loan as a return obligation with the stored due date", () => {
    assert.equal(
      avisoRepresentanteLabels.modalidade({
        identificador: "HM1001",
        modalidade: "EMPRESTIMO",
        emprestimoVenceEm: "2026-07-12",
      }),
      "Empréstimo — obrigação de devolução até 12/07/2026",
    );
  });

  it("formats a full iso due date on the utc calendar day", () => {
    assert.equal(
      avisoRepresentanteLabels.modalidade({
        identificador: "HM1001",
        modalidade: "EMPRESTIMO",
        emprestimoVenceEm: "2026-07-12T15:30:00.000Z",
      }),
      "Empréstimo — obrigação de devolução até 12/07/2026",
    );
  });

  it("labels a loan without a due date as not informed", () => {
    assert.equal(
      avisoRepresentanteLabels.modalidade({
        identificador: "HM1001",
        modalidade: "EMPRESTIMO",
        emprestimoVenceEm: null,
      }),
      "Empréstimo — obrigação de devolução até Não informado",
    );
  });

  it("labels a sale as a definitive exit", () => {
    assert.equal(
      avisoRepresentanteLabels.modalidade({
        identificador: "HM1002",
        modalidade: "VENDA",
        emprestimoVenceEm: "2026-07-12",
      }),
      "Venda — saída definitiva",
    );
  });

  it("keeps the read date on the calendar day", () => {
    assert.equal(
      avisoRepresentanteLabels.lidoEm("2026-10-13T18:40:00.000Z"),
      "Lido em 13/10/2026",
    );
  });
});
