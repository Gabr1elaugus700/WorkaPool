import assert from "node:assert/strict";
import { describe, it } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { MobileBottomNav } from "./MobileBottomNav";
import { HOME_NAV_ITEM, NAV_ITEMS } from "./navItems";
import { filterNavItems, selectMobileNavItems } from "./navItems.utils";

describe("MobileBottomNav", () => {
  it("mostra Expedição, Gestão e Controle com rótulo curto e sem rota antiga", () => {
    const items = selectMobileNavItems(
      filterNavItems(NAV_ITEMS, "ADMIN", "main"),
      filterNavItems(NAV_ITEMS, "ADMIN", "admin"),
      HOME_NAV_ITEM,
    );
    const html = renderToStaticMarkup(
      React.createElement(
        MemoryRouter,
        null,
        React.createElement(MobileBottomNav, {
          items,
          isActive: (path: string) => path === "/gestao-ibc",
        }),
      ),
    );

    assert.match(html, /aria-label="Navegação principal"/);
    assert.match(html, /href="\/expedicao-ibc"/);
    assert.match(html, /href="\/gestao-ibc"/);
    assert.match(html, /href="\/controle-ibc"/);
    assert.match(html, /Exp\. IBC/);
    assert.match(html, /Gest\. IBC/);
    assert.match(html, /Ctrl\. IBC/);
    assert.match(html, /aria-current="page"/);
    assert.doesNotMatch(html, /avisos-ibc|emprestimos-ibc|cadastro-ibc|conciliacao-ibc|checklists-ibc/);
  });
});
