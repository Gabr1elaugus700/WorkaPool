import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { IbcAlocacaoRequestError } from "./ibcAlocacaoError";

const RECOVERY =
  "Este identificador foi trocado numa conversão ou mudança de produto. Vincule o código novo — o de origem não entra na expedição.";

describe("IbcAlocacaoRequestError", () => {
  it("traduz IBC_SUBSTITUIDO para orientação de recuperação", () => {
    const error = IbcAlocacaoRequestError.fromBody(
      {
        code: "IBC_SUBSTITUIDO",
        error: "Este IBC foi substituído e não pode ser alocado.",
      },
      "fallback",
    );

    assert.equal(error.substituido, true);
    assert.equal(error.code, "IBC_SUBSTITUIDO");
    assert.equal(error.title, "IBC substituído");
    assert.equal(error.message, RECOVERY);
  });

  it("preserva a mensagem da API nos demais conflitos", () => {
    const error = IbcAlocacaoRequestError.fromBody(
      { code: "IBC_INAPTO", error: "IBC H0099 está Inapto e não pode ser alocado" },
      "fallback",
    );

    assert.equal(error.substituido, false);
    assert.equal(error.title, null);
    assert.equal(error.message, "IBC H0099 está Inapto e não pode ser alocado");
  });

  it("usa o fallback quando o corpo não traz mensagem", async () => {
    const response = new Response("nope", {
      status: 500,
      headers: { "content-type": "text/plain" },
    });
    const error = await IbcAlocacaoRequestError.fromResponse(response);

    assert.equal(error.code, null);
    assert.equal(error.message, "Não foi possível vincular o IBC.");
  });
});
