import assert from "node:assert/strict";
import { describe, it } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import GestaoIbcHeader from "./GestaoIbcHeader";

function html(userRole: string, activeSection: "containers" | "checklists" | "conciliacao") {
  return renderToStaticMarkup(
    React.createElement(
      MemoryRouter,
      null,
      React.createElement(GestaoIbcHeader, { activeSection, userRole }),
    ),
  );
}

describe("GestaoIbcHeader", () => {
  it("marca a aba ativa e lista as três para ADMIN", () => {
    const markup = html("ADMIN", "containers");
    assert.match(markup, /Gestão de IBC/);
    assert.match(markup, /href="\/gestao-ibc\/containers"/);
    assert.match(markup, /href="\/gestao-ibc\/checklists"/);
    assert.match(markup, /href="\/gestao-ibc\/conciliacao"/);
    assert.match(markup, /aria-current="page"/);
  });

  it("omite Checklists para LOGISTICA", () => {
    const markup = html("LOGISTICA", "conciliacao");
    assert.match(markup, /Containers/);
    assert.match(markup, /Conciliação ERP/);
    assert.doesNotMatch(markup, /Checklists/);
  });
});
