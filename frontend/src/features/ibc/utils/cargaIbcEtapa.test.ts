import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildCargaIbcEtapas,
  parseCargaIbcEtapa,
  resolveCargaIbcEtapaAtual,
  resolveCargaIbcEtapaVista,
  resolveCargaIbcVoltar,
} from "./cargaIbcEtapa";

describe("resolveCargaIbcEtapaAtual", () => {
  it("fica na Preparação enquanto a expedição não foi fechada", () => {
    assert.equal(resolveCargaIbcEtapaAtual({ temExpedicao: false, viagemFechadaEm: null }), "preparacao");
  });

  it("vai para Em viagem quando a expedição foi fechada e a viagem não", () => {
    assert.equal(resolveCargaIbcEtapaAtual({ temExpedicao: true, viagemFechadaEm: null }), "em-viagem");
  });

  it("vai para Fechar viagem quando a viagem já foi fechada", () => {
    assert.equal(
      resolveCargaIbcEtapaAtual({ temExpedicao: true, viagemFechadaEm: "2026-10-19T12:00:00.000Z" }),
      "fechar-viagem",
    );
  });
});

describe("parseCargaIbcEtapa", () => {
  it("aceita só as etapas conhecidas", () => {
    assert.equal(parseCargaIbcEtapa("fechar-viagem"), "fechar-viagem");
    assert.equal(parseCargaIbcEtapa("preparacao"), "preparacao");
    assert.equal(parseCargaIbcEtapa("conciliacao"), null);
    assert.equal(parseCargaIbcEtapa(undefined), null);
  });
});

describe("resolveCargaIbcEtapaVista", () => {
  it("abre a etapa atual quando nenhuma foi pedida", () => {
    assert.equal(resolveCargaIbcEtapaVista("em-viagem", null), "em-viagem");
  });

  it("não deixa abrir etapas depois da Preparação antes de fechar a expedição", () => {
    assert.equal(resolveCargaIbcEtapaVista("preparacao", "fechar-viagem"), "preparacao");
    assert.equal(resolveCargaIbcEtapaVista("preparacao", "em-viagem"), "preparacao");
  });

  it("deixa abrir Fechar viagem com a carga em viagem e voltar para etapas anteriores", () => {
    assert.equal(resolveCargaIbcEtapaVista("em-viagem", "fechar-viagem"), "fechar-viagem");
    assert.equal(resolveCargaIbcEtapaVista("fechar-viagem", "preparacao"), "preparacao");
  });
});

describe("buildCargaIbcEtapas", () => {
  it("marca concluídas, atual e futuras, com link só nas etapas alcançáveis", () => {
    const etapas = buildCargaIbcEtapas({ codCar: 378, atual: "em-viagem", vista: "em-viagem", viagemFechada: false });
    assert.deepEqual(
      etapas.map(({ id, estado, to, selecionada }) => [id, estado, to, selecionada]),
      [
        ["preparacao", "concluida", "/expedicao-ibc/378/preparacao", false],
        ["em-viagem", "atual", "/expedicao-ibc/378/em-viagem", true],
        ["fechar-viagem", "futura", "/expedicao-ibc/378/fechar-viagem", false],
      ],
    );
  });

  it("sem expedição, só a Preparação tem link", () => {
    const etapas = buildCargaIbcEtapas({ codCar: 10, atual: "preparacao", vista: "preparacao", viagemFechada: false });
    assert.deepEqual(
      etapas.map(({ id, to }) => [id, to]),
      [
        ["preparacao", "/expedicao-ibc/10/preparacao"],
        ["em-viagem", null],
        ["fechar-viagem", null],
      ],
    );
  });

  it("com a viagem fechada, todas as etapas ficam concluídas", () => {
    const etapas = buildCargaIbcEtapas({ codCar: 7, atual: "fechar-viagem", vista: "fechar-viagem", viagemFechada: true });
    assert.deepEqual(
      etapas.map(({ estado }) => estado),
      ["concluida", "concluida", "concluida"],
    );
  });
});

describe("resolveCargaIbcVoltar", () => {
  it("volta para a aba de onde a carga vem", () => {
    assert.equal(resolveCargaIbcVoltar("preparacao"), "/expedicao-ibc");
    assert.equal(resolveCargaIbcVoltar("em-viagem"), "/expedicao-ibc/em-viagem");
    assert.equal(resolveCargaIbcVoltar("fechar-viagem"), "/expedicao-ibc/em-viagem");
  });
});
