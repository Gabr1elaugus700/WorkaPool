import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formatClientesCarga } from "./cargaIbcCard.utils";

const cliente = (nome: string) => ({ cliente: nome, codCli: null });

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
