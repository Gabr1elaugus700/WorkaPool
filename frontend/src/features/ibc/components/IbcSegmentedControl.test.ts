import assert from "node:assert/strict";
import { describe, it } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import IbcSegmentedControl from "./IbcSegmentedControl";
import { nextSegmentIndex } from "@/utils/nextSegmentIndex";

const OPCOES = [
  { id: "FICOU", label: "Ficou no cliente" },
  { id: "RETORNOU", label: "Retornou no caminhão" },
  { id: "TROCA", label: "Troca" },
] as const;

function render(value: string | null, disabled = false): string {
  return renderToStaticMarkup(
    React.createElement(IbcSegmentedControl, {
      ariaLabel: "Destino de H0045",
      options: OPCOES,
      value,
      disabled,
      onChange: () => undefined,
    }),
  );
}

describe("IbcSegmentedControl", () => {
  it("expõe um radiogroup com uma opção marcada", () => {
    const html = render("RETORNOU");
    assert.match(html, /role="radiogroup"[^>]*aria-label="Destino de H0045"/);
    assert.equal(html.match(/role="radio"/g)?.length, 3);
    assert.equal(html.match(/aria-checked="true"/g)?.length, 1);
    assert.match(html, /aria-checked="true"[^>]*tabindex="0"[^>]*>Retornou no caminhão</);
  });

  it("sem valor, a primeira opção recebe o foco do teclado", () => {
    const html = render(null);
    assert.equal(html.match(/tabindex="0"/g)?.length, 1);
    assert.match(html, /tabindex="0"[^>]*>Ficou no cliente</);
  });

  it("desabilita todas as opções", () => {
    assert.equal(render("FICOU", true).match(/disabled=""/g)?.length, 3);
  });
});

describe("nextSegmentIndex", () => {
  it("anda com as setas e dá a volta nas pontas", () => {
    assert.equal(nextSegmentIndex(0, "ArrowRight", 3), 1);
    assert.equal(nextSegmentIndex(2, "ArrowRight", 3), 0);
    assert.equal(nextSegmentIndex(0, "ArrowLeft", 3), 2);
    assert.equal(nextSegmentIndex(1, "ArrowDown", 3), 2);
    assert.equal(nextSegmentIndex(1, "ArrowUp", 3), 0);
  });

  it("Home e End vão para as pontas; outras teclas não mexem", () => {
    assert.equal(nextSegmentIndex(1, "Home", 3), 0);
    assert.equal(nextSegmentIndex(1, "End", 3), 2);
    assert.equal(nextSegmentIndex(1, "Enter", 3), null);
  });
});
