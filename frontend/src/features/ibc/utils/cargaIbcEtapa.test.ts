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

describe("cargaIbcEtapa.pedida", () => {
  it("trata ?origem=em-viagem como a etapa Em viagem, mesmo com outro path", () => {
    assert.equal(cargaIbcEtapa.pedida(undefined, "em-viagem"), "em-viagem");
    assert.equal(cargaIbcEtapa.pedida("fechar-viagem", "em-viagem"), "em-viagem");
  });

  it("sem a query antiga, usa a etapa do path", () => {
    assert.equal(cargaIbcEtapa.pedida("preparacao", null), "preparacao");
    assert.equal(cargaIbcEtapa.pedida("conciliacao", null), null);
    assert.equal(cargaIbcEtapa.pedida(undefined, "aguardando"), null);
  });
});

describe("cargaIbcEtapa.naRota", () => {
  it("manda o link antigo para Em viagem mesmo com a viagem já fechada", () => {
    const atual = cargaIbcEtapa.resolverAtual({
      temExpedicao: true,
      viagemFechadaEm: "2026-10-19T12:00:00.000Z",
    });
    const rota = cargaIbcEtapa.naRota({
      codCar: 378,
      etapaParam: undefined,
      origem: "em-viagem",
      atual,
    });
    assert.equal(rota.vista, "em-viagem");
    assert.equal(rota.redirectTo, "/expedicao-ibc/378/em-viagem");
  });

  it("antes de fechar a expedição, o link antigo fica na Preparação", () => {
    const rota = cargaIbcEtapa.naRota({
      codCar: 10,
      etapaParam: undefined,
      origem: "em-viagem",
      atual: "preparacao",
    });
    assert.equal(rota.vista, "preparacao");
    assert.equal(rota.redirectTo, cargaIbcEtapa.path(10, "preparacao"));
  });

  it("tira a query legada mesmo quando o path já é a etapa vista", () => {
    const rota = cargaIbcEtapa.naRota({
      codCar: 378,
      etapaParam: "em-viagem",
      origem: "em-viagem",
      atual: "em-viagem",
    });
    assert.equal(rota.redirectTo, "/expedicao-ibc/378/em-viagem");
  });

  it("não redireciona a URL que já mostra a etapa certa", () => {
    const rota = cargaIbcEtapa.naRota({
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
      cargaIbcEtapa.naRota({
        codCar: 378,
        etapaParam: "conciliacao",
        origem: null,
        atual: "em-viagem",
      }).redirectTo,
      "/expedicao-ibc/378/em-viagem",
    );
    assert.equal(
      cargaIbcEtapa.naRota({
        codCar: 10,
        etapaParam: "fechar-viagem",
        origem: null,
        atual: "preparacao",
      }).redirectTo,
      "/expedicao-ibc/10/preparacao",
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

describe("cargaIbcEtapa.carregamento", () => {
  const base = {
    detalheCarregado: true,
    temExpedicao: true,
    viagemCarregada: false,
    erroConciliacao: false,
    fechouExpedicaoNestaTela: false,
  };

  it("ocupa a página enquanto a carga não chegou", () => {
    assert.equal(cargaIbcEtapa.carregamento({ ...base, detalheCarregado: false }), "pagina");
  });

  it("ocupa a página no primeiro acesso a uma carga com expedição, até a viagem chegar", () => {
    assert.equal(cargaIbcEtapa.carregamento(base), "pagina");
  });

  it("fica só na área da etapa quando a expedição acabou de ser fechada nesta tela", () => {
    assert.equal(cargaIbcEtapa.carregamento({ ...base, fechouExpedicaoNestaTela: true }), "etapa");
  });

  it("para de carregar quando a conciliação falha", () => {
    assert.equal(cargaIbcEtapa.carregamento({ ...base, erroConciliacao: true }), null);
    assert.equal(
      cargaIbcEtapa.carregamento({ ...base, erroConciliacao: true, fechouExpedicaoNestaTela: true }),
      null,
    );
  });

  it("não carrega nada com a viagem pronta ou sem expedição", () => {
    assert.equal(cargaIbcEtapa.carregamento({ ...base, viagemCarregada: true }), null);
    assert.equal(cargaIbcEtapa.carregamento({ ...base, temExpedicao: false }), null);
  });
});
