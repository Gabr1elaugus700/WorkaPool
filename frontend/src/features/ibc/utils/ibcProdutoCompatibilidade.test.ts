import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ibcProdutoCompatibilidade } from "./ibcProdutoCompatibilidade";

const conflito = {
  code: "IBC_PRODUTO_INCOMPATIVEL",
  error: "mensagem crua da API",
  details: {
    identificador: "NHCL1",
    grupoContainer: "CLORO",
    gruposPermitidos: ["SODA"],
  },
};

describe("ibcProdutoCompatibilidade", () => {
  it("explica o container de outro produto e os grupos da carga", () => {
    assert.equal(
      ibcProdutoCompatibilidade.mensagemConflito(
        { ...conflito, details: { ...conflito.details, gruposPermitidos: ["SODA", "ACIDO"] } },
        "carga",
      ),
      "O container NHCL1 é de outro produto (grupo CLORO). Esta carga aceita SODA e ACIDO.",
    );
  });

  it("trata legado sem placa e pedido que só aceita universal", () => {
    assert.equal(
      ibcProdutoCompatibilidade.mensagemConflito(
        { ...conflito, details: { identificador: "HM00012", grupoContainer: null, gruposPermitidos: [] } },
        "pedido",
      ),
      "O container HM00012 é de outro produto e não tem grupo na placa. Este pedido só aceita container universal.",
    );
    assert.equal(ibcProdutoCompatibilidade.mensagemConflito({ code: "IBC_INAPTO" }, "pedido"), null);
  });

  it("avisa o grupo sem configuração e afirma que a carga segue", () => {
    const avisos = ibcProdutoCompatibilidade.avisosDe([
      {
        code: "IBC_PEDIDO_GRUPO_SEM_CONFIG",
        numPed: "1120",
        gruposCodigo: ["SODA"],
        message: "Pedido 1120: grupo SODA não tem configuração de placa. Só o container universal atende.",
      },
      { code: "OUTRO", numPed: "1" },
    ]);
    const aviso = avisos[0];
    assert.ok(aviso);
    assert.equal(aviso.numPed, "1120");
    assert.match(ibcProdutoCompatibilidade.textoAviso(aviso), /A carga segue/);
    assert.match(
      ibcProdutoCompatibilidade.textoAviso({
        code: "IBC_PEDIDO_GRUPO_SEM_CONFIG",
        numPed: "20",
        gruposCodigo: ["CLORO", "SODA"],
        message: "",
      }),
      /grupos CLORO e SODA não têm configuração de placa e cor/,
    );
  });
});
