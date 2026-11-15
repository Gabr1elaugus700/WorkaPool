import assert from "node:assert/strict";
import { describe, it } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import ExpedicaoIbcPageTabs from "./ExpedicaoIbcPageTabs";

describe("ExpedicaoIbcPageTabs", () => {
  it("renders segmented tabs with count badges", () => {
    const html = renderToStaticMarkup(
      React.createElement(
        MemoryRouter,
        null,
        React.createElement(ExpedicaoIbcPageTabs, {
          activeId: "aguardando",
          counts: { aguardando: 1, "em-viagem": 0, entrada: 0 },
        }),
      ),
    );

    assert.match(html, /Aguardando expedição/);
    assert.match(html, /Em viagem/);
    assert.match(html, /Entrada no pátio/);
    assert.match(html, /aria-current="page"/);
    assert.match(html, /bg-amber-100/);
    assert.match(html, />1</);
    assert.match(html, />0</);
  });
});