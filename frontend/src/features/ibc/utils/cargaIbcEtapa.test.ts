import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildCargaIbcEtapas,
  cargaIbcEtapaPath,
  parseCargaIbcEtapa,
  resolveCargaIbcEtapaAtual,
  resolveCargaIbcEtapaNaRota,
  resolveCargaIbcEtapaPedida,
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

describe("resolveCargaIbcEtapaPedida", () => {
  it("trata ?origem=em-viagem como a etapa Em viagem, mesmo com outro path", () => {
    assert.equal(resolveCargaIbcEtapaPedida(undefined, "em-viagem"), "em-viagem");
    assert.equal(resolveCargaIbcEtapaPedida("fechar-viagem", "em-viagem"), "em-viagem");
  });

  it("sem a query antiga, usa a etapa do path", () => {
    assert.equal(resolveCargaIbcEtapaPedida("preparacao", null), "preparacao");
    assert.equal(resolveCargaIbcEtapaPedida("conciliacao", null), null);
    assert.equal(resolveCargaIbcEtapaPedida(undefined, "aguardando"), null);
  });
});

describe("resolveCargaIbcEtapaNaRota", () => {
  it("manda o link antigo para Em viagem mesmo com a viagem já fechada", () => {
    const atual = resolveCargaIbcEtapaAtual({
      temExpedicao: true,
      viagemFechadaEm: "2026-10-19T12:00:00.000Z",
    });
    const rota = resolveCargaIbcEtapaNaRota({
      codCar: 378,
      etapaParam: undefined,
      origem: "em-viagem",
      atual,
    });
    assert.equal(rota.vista, "em-viagem");
    assert.equal(rota.redirectTo, "/expedicao-ibc/378/em-viagem");
  });

  it("antes de fechar a expedição, o link antigo fica na Preparação", () => {
    const rota = resolveCargaIbcEtapaNaRota({
      codCar: 10,
      etapaParam: undefined,
      origem: "em-viagem",
      atual: "preparacao",
    });
    assert.equal(rota.vista, "preparacao");
    assert.equal(rota.redirectTo, cargaIbcEtapaPath(10, "preparacao"));
  });

  it("tira a query legada mesmo quando o path já é a etapa vista", () => {
    const rota = resolveCargaIbcEtapaNaRota({
      codCar: 378,
      etapaParam: "em-viagem",
      origem: "em-viagem",
      atual: "em-viagem",
    });
    assert.equal(rota.redirectTo, "/expedicao-ibc/378/em-viagem");
  });

  it("não redireciona a URL que já mostra a etapa certa", () => {
    const rota = resolveCargaIbcEtapaNaRota({
      codCar: 378,
      etapaParam: undefined,
      origem: null,
      atual: "em-viagem",
    });
    assert.equal(rota.vista, "em-viagem");
    assert.equal(rota.redirectTo, null);
  });

  it("corrige etapa inválida ou ainda não alcançável", () => {
    assert.equal(
      resolveCargaIbcEtapaNaRota({
        codCar: 378,
        etapaParam: "conciliacao",
        origem: null,
        atual: "em-viagem",
      }).redirectTo,
      "/expedicao-ibc/378/em-viagem",
    );
    assert.equal(
      resolveCargaIbcEtapaNaRota({
        codCar: 10,
        etapaParam: "fechar-viagem",
        origem: null,
        atual: "preparacao",
      }).redirectTo,
      "/expedicao-ibc/10/preparacao",
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
