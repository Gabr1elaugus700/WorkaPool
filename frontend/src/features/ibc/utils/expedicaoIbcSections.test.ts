import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { EXPEDICAO_IBC_SECTIONS, expedicaoIbcStationTone } from "./expedicaoIbcSections";

describe("EXPEDICAO_IBC_SECTIONS", () => {
  it("mantém as três abas nas rotas atuais, na ordem da viagem", () => {
    assert.deepEqual(
      EXPEDICAO_IBC_SECTIONS.map((section) => [section.id, section.to]),
      [
        ["aguardando", "/expedicao-ibc"],
        ["em-viagem", "/expedicao-ibc/em-viagem"],
        ["entrada", "/expedicao-ibc/entrada"],
      ],
    );
  });

  it("define faixa e badge para cada estação", () => {
    for (const section of EXPEDICAO_IBC_SECTIONS) {
      const tone = expedicaoIbcStationTone[section.id];
      assert.ok(tone.label);
      assert.ok(tone.stripeClass);
      assert.ok(tone.badgeClass);
    }
  });
});
