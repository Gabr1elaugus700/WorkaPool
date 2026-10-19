import assert from "node:assert/strict";
import { describe, it } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import IbcAccessDeniedAlert from "./IbcAccessDeniedAlert";

describe("IbcAccessDeniedAlert", () => {
  it("mostra o texto montado a partir das roles exigidas", () => {
    const html = renderToStaticMarkup(
      React.createElement(IbcAccessDeniedAlert, {
        requiredRoles: ["ADMIN", "ALMOX", "LOGISTICA", "GERENTE_DPTO"],
        targetPhrase: "o Cadastro IBC",
      }),
    );
    assert.match(html, /Acesso negado/);
    assert.match(
      html,
      /Apenas ADMIN, ALMOX, LOGISTICA e GERENTE_DPTO podem acessar o Cadastro IBC\./,
    );
  });
});
