import assert from "node:assert/strict";
import { describe, it } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import IbcPageTabs from "./IbcPageTabs";
import type { IbcPageTab } from "../utils/filterIbcPageTabs";

const TABS: readonly IbcPageTab[] = [
  { id: "aguardando", to: "/expedicao-ibc", label: "Aguardando expedição" },
  {
    id: "checklists",
    to: "/gestao-ibc/checklists",
    label: "Checklists",
    allowedRoles: ["ADMIN", "ALMOX"],
  },
];

describe("IbcPageTabs", () => {
  it("não renderiza aba oculta para o role atual", () => {
    const html = renderToStaticMarkup(
      React.createElement(
        MemoryRouter,
        null,
        React.createElement(IbcPageTabs, {
          tabs: TABS,
          activeId: "aguardando",
          userRole: "VENDAS",
          ariaLabel: "Expedição IBC",
        }),
      ),
    );
    assert.match(html, /Aguardando expedição/);
    assert.match(html, /aria-current="page"/);
    assert.doesNotMatch(html, /Checklists/);
  });
});
