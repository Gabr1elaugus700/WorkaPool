import assert from "node:assert/strict";
import { describe, it } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import IbcPageTabs from "../components/IbcPageTabs";
import { controleIbcSections } from "./controleIbcSections";

describe("controleIbcSections", () => {
  it("mantém Avisos e Empréstimos para ADMIN e VENDAS", () => {
    for (const role of ["ADMIN", "VENDAS"]) {
      assert.deepEqual(controleIbcSections.resolve(role, "avisos"), { status: "ok" });
      assert.deepEqual(controleIbcSections.resolve(role, "emprestimos"), { status: "ok" });
    }
  });

  it("manda LOGISTICA e GERENTE_DPTO da aba Avisos para Empréstimos", () => {
    for (const role of ["LOGISTICA", "GERENTE_DPTO"]) {
      assert.deepEqual(controleIbcSections.resolve(role, "avisos"), {
        status: "redirect",
        to: "/controle-ibc/emprestimos",
      });
      assert.deepEqual(controleIbcSections.resolve(role, "emprestimos"), { status: "ok" });
    }
  });

  it("nega quem não via nenhuma das duas telas", () => {
    for (const role of ["ALMOX", "USER", "MOTORISTA", undefined]) {
      assert.deepEqual(controleIbcSections.resolve(role, "avisos"), { status: "denied" });
      assert.deepEqual(controleIbcSections.resolve(role, "emprestimos"), { status: "denied" });
    }
  });

  it("aponta as abas para as rotas novas", () => {
    assert.deepEqual(
      controleIbcSections.tabs.map((tab) => [tab.id, tab.to]),
      [
        ["avisos", "/controle-ibc"],
        ["emprestimos", "/controle-ibc/emprestimos"],
      ],
    );
  });

  it("renderiza só a aba Empréstimos para LOGISTICA", () => {
    const html = renderToStaticMarkup(
      React.createElement(
        MemoryRouter,
        null,
        React.createElement(IbcPageTabs, {
          tabs: controleIbcSections.tabs,
          activeId: "emprestimos",
          userRole: "LOGISTICA",
          ariaLabel: "Controle IBC",
        }),
      ),
    );

    assert.match(html, /Empréstimos em atraso/);
    assert.match(html, /aria-current="page"/);
    assert.doesNotMatch(html, /Avisos/);
  });
});
