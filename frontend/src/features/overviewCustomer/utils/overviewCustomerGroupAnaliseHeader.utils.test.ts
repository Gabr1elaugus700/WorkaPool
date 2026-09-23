import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  formatGroupAnalysisSubtitle,
  formatGroupPerdaTotalPill,
  formatGroupShareLabel,
  formatGroupVolumePill,
  sumGroupPerdaTotal,
  sumGroupVolumeKg,
  truncateMotivoBadge,
} from "./overviewCustomerGroupAnaliseHeader.utils";

describe("overviewCustomerGroupAnaliseHeader.utils", () => {
  it("sums volume and perda totals from rows", () => {
    assert.equal(
      sumGroupVolumeKg([
        { qtdped: 1000 },
        { qtdped: 500.5 },
      ]),
      1500.5,
    );
    assert.equal(
      sumGroupPerdaTotal([
        { vlrfinal: 100 },
        { vlrfinal: 25.5 },
      ]),
      125.5,
    );
  });

  it("formats group share, pills and subtitles", () => {
    assert.equal(formatGroupShareLabel("Lauril", 27), "Lauril 27%");
    assert.equal(formatGroupShareLabel("Lauril", null), "Lauril");
    assert.match(formatGroupVolumePill(5000), /Volume:/);
    assert.match(formatGroupVolumePill(5000), /kg/);
    assert.match(formatGroupPerdaTotalPill(26547.89), /Perda Total:/);
    assert.match(
      formatGroupAnalysisSubtitle("ganhos", "Lauril", 27),
      /Até 5 notas faturadas do grupo selecionado \(Lauril 27%\)/,
    );
    assert.match(
      formatGroupAnalysisSubtitle("perdidos", "Lauril", 27),
      /Até 5 pedidos perdidos do grupo selecionado \(Lauril 27%\)/,
    );
  });

  it("truncates motivo badges and skips the sentinel", () => {
    assert.equal(truncateMotivoBadge("Sem justificativa registrada."), null);
    assert.equal(truncateMotivoBadge("  "), null);
    assert.equal(truncateMotivoBadge("Perda por Preço"), "Perda por Preço");
    const long = "Concorrente Química Sul fechou abaixo do nosso preço ofertado";
    const badge = truncateMotivoBadge(long, 28);
    assert.ok(badge != null);
    assert.ok(badge.length <= 28);
    assert.match(badge, /…$/);
  });
});
