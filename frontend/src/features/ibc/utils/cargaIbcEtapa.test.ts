import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { cargaIbcEtapa } from "./cargaIbcEtapa";

describe("cargaIbcEtapa.resolverAtual", () => {
  it("fica na Preparação enquanto a expedição não foi fechada", () => {
    assert.equal(cargaIbcEtapa.resolverAtual({ temExpedicao: false, viagemFechadaEm: null }), "preparacao");
  });

  it("vai para Em viagem quando a expedição foi fechada e a viagem não", () => {
    assert.equal(cargaIbcEtapa.resolverAtual({ temExpedicao: true, viagemFechadaEm: null }), "em-viagem");
  });

  it("vai para Fechar viagem quando a viagem já foi fechada", () => {
    assert.equal(
      cargaIbcEtapa.resolverAtual({ temExpedicao: true, viagemFechadaEm: "2026-10-19T12:00:00.000Z" }),
      "fechar-viagem",
    );
  });
});

describe("cargaIbcEtapa.parse", () => {
  it("aceita só as etapas conhecidas", () => {
    assert.equal(cargaIbcEtapa.parse("fechar-viagem"), "fechar-viagem");
    assert.equal(cargaIbcEtapa.parse("preparacao"), "preparacao");
    assert.equal(cargaIbcEtapa.parse("conciliacao"), null);
    assert.equal(cargaIbcEtapa.parse(undefined), null);
  });
});

describe("cargaIbcEtapa.resolverVista", () => {
  it("abre a etapa atual quando nenhuma foi pedida", () => {
    assert.equal(cargaIbcEtapa.resolverVista("em-viagem", null), "em-viagem");
  });

  it("não deixa abrir etapas depois da Preparação antes de fechar a expedição", () => {
    assert.equal(cargaIbcEtapa.resolverVista("preparacao", "fechar-viagem"), "preparacao");
    assert.equal(cargaIbcEtapa.resolverVista("preparacao", "em-viagem"), "preparacao");
  });

  it("deixa abrir Fechar viagem com a carga em viagem e voltar para etapas anteriores", () => {
    assert.equal(cargaIbcEtapa.resolverVista("em-viagem", "fechar-viagem"), "fechar-viagem");
    assert.equal(cargaIbcEtapa.resolverVista("fechar-viagem", "preparacao"), "preparacao");
  });
});

describe("cargaIbcEtapa.montarItens", () => {
  it("marca concluídas, atual e futuras, com link só nas etapas alcançáveis", () => {
    const etapas = cargaIbcEtapa.montarItens({ codCar: 378, atual: "em-viagem", vista: "em-viagem", viagemFechada: false });
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
    const etapas = cargaIbcEtapa.montarItens({ codCar: 10, atual: "preparacao", vista: "preparacao", viagemFechada: false });
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
    const etapas = cargaIbcEtapa.montarItens({ codCar: 7, atual: "fechar-viagem", vista: "fechar-viagem", viagemFechada: true });
    assert.deepEqual(
      etapas.map(({ estado }) => estado),
      ["concluida", "concluida", "concluida"],
    );
  });
});

describe("cargaIbcEtapa.voltarPara", () => {
  it("volta para a aba de onde a carga vem", () => {
    assert.equal(cargaIbcEtapa.voltarPara("preparacao"), "/expedicao-ibc");
    assert.equal(cargaIbcEtapa.voltarPara("em-viagem"), "/expedicao-ibc/em-viagem");
    assert.equal(cargaIbcEtapa.voltarPara("fechar-viagem"), "/expedicao-ibc/em-viagem");
  });
});
