import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formatCargaPrevisaoSaidaLabel, formatClientesCarga } from "./cargaIbcCard.utils";

const cliente = (nome: string) => ({ cliente: nome, codCli: null });

describe("formatCargaPrevisaoSaidaLabel", () => {
  it("formata YYYY-MM-DD em pt-BR", () => {
    assert.equal(formatCargaPrevisaoSaidaLabel("2026-11-20"), "20/11/2026");
  });

  it("ignora hora em ISO datetime", () => {
    assert.equal(formatCargaPrevisaoSaidaLabel("2026-11-20T08:00:00.000Z"), "20/11/2026");
  });
});

describe("formatClientesCarga", () => {
  it("junta até três clientes", () => {
    const label = formatClientesCarga([cliente("Aurora"), cliente("Aqua Sul"), cliente("Casa Azul")]);
    assert.equal(label, "Aurora · Aqua Sul · Casa Azul");
  });

  it("resume os excedentes com +N", () => {
    const label = formatClientesCarga([
      cliente("A"),
      cliente("B"),
      cliente("C"),
      cliente("D"),
      cliente("E"),
    ]);
    assert.equal(label, "A · B · C +2");
  });

  it("ignora nomes vazios", () => {
    assert.equal(formatClientesCarga([cliente(""), cliente("Aurora")]), "Aurora");
  });

  it("retorna vazio sem clientes", () => {
    assert.equal(formatClientesCarga([]), "");
  });
});
