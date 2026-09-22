import assert from "node:assert/strict";
import { describe, it } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { OverviewCustomerDetailSyncFooter } from "./OverviewCustomerDetailSyncFooter";

describe("OverviewCustomerDetailSyncFooter", () => {
  it("renders last successful sync timestamp", () => {
    const markup = renderToStaticMarkup(
      React.createElement(OverviewCustomerDetailSyncFooter, {
        lastSuccessfulSyncAt: "2026-09-17T03:00:00.000Z",
      }),
    );

    assert.match(markup, /Última sincronização com sucesso/);
    assert.match(markup, /2026-09-17T03:00:00.000Z/);
  });

  it("renders fallback when sync timestamp is missing", () => {
    const markup = renderToStaticMarkup(
      React.createElement(OverviewCustomerDetailSyncFooter, {
        lastSuccessfulSyncAt: null,
      }),
    );

    assert.match(markup, /Não informado/);
  });
});
