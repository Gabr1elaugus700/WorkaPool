import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { ConciliacaoViagemItemDTO, PedidoConciliacaoDTO } from "../types/conciliacaoViagem.types";
import { conciliacaoVolta } from "./conciliacaoVolta.utils";

function pedido(patch: Partial<PedidoConciliacaoDTO> & Pick<PedidoConciliacaoDTO, "numPed">): PedidoConciliacaoDTO {
  return {
    codCli: "10",
    cliente: "Alpha",
    incluso: false,
    quantidadeEsperada: 2,
    quantidadeApontada: 0,
    posCar: 1,
    gruposCodigo: ["HIPO"],
    ...patch,
  };
}

function item(patch: Partial<ConciliacaoViagemItemDTO>): ConciliacaoViagemItemDTO {
  return {
    alocacaoIbcId: "a",
    ibcId: "i",
    identificador: "HMH00001",
    corHex: "#2563EB",
    grupoCodigo: "HIPO",
    universal: false,
    homologado: true,
    numPed: null,
    codCli: null,
    cliente: "",
    destino: null,
    modalidade: null,
    modalidadeSugerida: null,
    ibcEntradaId: null,
    ...patch,
  };
}

describe("conciliacaoVolta", () => {
  it("conta ficou e troca no pedido e ignora retorno e o total gravado", () => {
    const barras = conciliacaoVolta.barras(
      [pedido({ numPed: "10", quantidadeApontada: 9 }), pedido({ numPed: "20", quantidadeEsperada: 1 })],
      [
        item({ destino: "FICOU", numPed: "10" }),
        item({ alocacaoIbcId: "b", destino: "TROCA", numPed: "10" }),
        item({ alocacaoIbcId: "c", destino: "RETORNOU", numPed: "10" }),
        item({ alocacaoIbcId: "d", destino: "FICOU", numPed: null }),
        item({ alocacaoIbcId: "e", destino: null, numPed: "20" }),
      ],
    );
    assert.equal(barras[0]?.quantidadeApontada, 2);
    assert.equal(barras[1]?.quantidadeApontada, 0);
  });

  it("confirma só o pedido cuja barra não fechou o esperado", () => {
    const barras = [
      pedido({ numPed: "10", quantidadeEsperada: 2, quantidadeApontada: 2 }),
      pedido({ numPed: "20", quantidadeEsperada: 2, quantidadeApontada: 1 }),
      pedido({ numPed: "30", quantidadeEsperada: 1, quantidadeApontada: 3 }),
    ];
    assert.deepEqual(conciliacaoVolta.confirmacoes(barras), [{ numPed: "20" }, { numPed: "30" }]);
    assert.deepEqual(conciliacaoVolta.divergentes(barras).map((pedido) => pedido.numPed), ["20", "30"]);
  });

  it("ordena clientes pelo menor posCar dos pedidos elegíveis e sem posCar pelo menor numPed", () => {
    const visao = conciliacaoVolta.montarVisao({
      codCar: 383,
      expedicaoIbcId: "exp-1",
      viagemFechadaEm: null,
      chegaramAMais: 0,
      itens: [],
      clientes: [],
      pedidos: [
        pedido({ numPed: "50", codCli: "C", cliente: "Gamma", posCar: null }),
        pedido({ numPed: "9", codCli: "D", cliente: "Delta", posCar: null }),
        pedido({ numPed: "30", codCli: "A", cliente: "Alpha", posCar: 4 }),
        pedido({ numPed: "12", codCli: "B", cliente: "Beta", posCar: 2 }),
        pedido({ numPed: "11", codCli: "A", cliente: "Alpha", posCar: 1, incluso: true, quantidadeEsperada: 3 }),
      ],
    });

    assert.deepEqual(visao.clientes.map((bloco) => bloco.cliente), ["Alpha", "Beta", "Delta", "Gamma"]);
    assert.deepEqual(visao.clientes[0]?.subBlocos.map((sub) => sub.numPed), ["11", "30"]);
    assert.equal(visao.clientes[0]?.subBlocos[0]?.incluso, true);
    assert.equal(visao.clientes[0]?.subBlocos[0]?.quantidadeEsperada, 3);
  });

  it("repete containers compatíveis e universais nos sub-blocos enquanto estão sem destino", () => {
    const visao = conciliacaoVolta.montarVisao(
      {
        codCar: 383,
        expedicaoIbcId: "exp-1",
        viagemFechadaEm: null,
        chegaramAMais: 0,
        clientes: [],
        pedidos: [
          pedido({ numPed: "10", codCli: "1", cliente: "Cliente Hipo 1", posCar: 1, gruposCodigo: ["HIPO"] }),
          pedido({ numPed: "20", codCli: "2", cliente: "Cliente Hipo 2", posCar: 2, gruposCodigo: ["HIPO"] }),
          pedido({ numPed: "30", codCli: "3", cliente: "Cliente Soda", posCar: 3, gruposCodigo: ["SODA"] }),
        ],
        itens: [
          item({ alocacaoIbcId: "h1", identificador: "HMH00001", grupoCodigo: "HIPO", corHex: "#2563EB" }),
          item({ alocacaoIbcId: "u1", identificador: "NH00001", grupoCodigo: null, universal: true, homologado: false, corHex: "#16A34A" }),
          item({ alocacaoIbcId: "s1", identificador: "HMS00001", grupoCodigo: "SODA", corHex: "#DC2626" }),
          item({ alocacaoIbcId: "leg", identificador: "HM0001", grupoCodigo: null, universal: false, homologado: true, corHex: null }),
        ],
      },
      [
        { grupoCodigo: "HIPO", sigla: "H", corHex: "#2563EB", grupoDescricao: "Hipoclorito" },
        { grupoCodigo: "SODA", sigla: "S", corHex: "#DC2626", grupoDescricao: "Soda cáustica" },
      ],
    );

    const idsNoSub = (clienteIdx: number) =>
      visao.clientes[clienteIdx]?.subBlocos[0]?.secoes.flatMap((secao) => secao.itens.map((i) => i.identificador));

    assert.deepEqual(idsNoSub(0), ["HMH00001", "NH00001"]);
    assert.deepEqual(idsNoSub(1), ["HMH00001", "NH00001"]);
    assert.deepEqual(idsNoSub(2), ["HMS00001", "NH00001"]);
    assert.equal(visao.clientes[0]?.subBlocos[0]?.secoes[0]?.grupoDescricao, "Hipoclorito");
    assert.equal(visao.clientes[0]?.subBlocos[0]?.secoes[1]?.tipo, "universal");
  });

  it("marcar Ficou ou Troca grava o pedido do sub-bloco, remove dos demais e alimenta a barra do cliente", () => {
    const pedidos = [
      pedido({ numPed: "10", codCli: "1", cliente: "Alpha", posCar: 1, gruposCodigo: ["HIPO"] }),
      pedido({ numPed: "11", codCli: "1", cliente: "Alpha", posCar: 2, gruposCodigo: ["HIPO"] }),
      pedido({ numPed: "20", codCli: "2", cliente: "Beta", posCar: 3, gruposCodigo: ["HIPO"] }),
    ];
    let itens = [
      item({ alocacaoIbcId: "h1", identificador: "HMH00001", grupoCodigo: "HIPO" }),
      item({ alocacaoIbcId: "h2", identificador: "HMH00002", grupoCodigo: "HIPO" }),
    ];

    itens = conciliacaoVolta.alternarDestino(itens, pedidos, "h1", "FICOU", "10");
    itens = conciliacaoVolta.alternarDestino(itens, pedidos, "h2", "TROCA", "11");

    const visao = conciliacaoVolta.montarVisao({
      codCar: 383,
      expedicaoIbcId: "exp-1",
      viagemFechadaEm: null,
      chegaramAMais: 0,
      clientes: [],
      pedidos,
      itens,
    });

    assert.equal(visao.clientes[0]?.ficou, 1);
    assert.equal(visao.clientes[0]?.troca, 1);
    assert.equal(visao.clientes[1]?.ficou, 0);
    assert.equal(visao.clientes[1]?.troca, 0);
    assert.deepEqual(
      visao.clientes[0]?.subBlocos[0]?.secoes.flatMap((s) => s.itens.map((i) => i.identificador)),
      ["HMH00001"],
    );
    assert.deepEqual(
      visao.clientes[0]?.subBlocos[1]?.secoes.flatMap((s) => s.itens.map((i) => i.identificador)),
      ["HMH00002"],
    );
    assert.deepEqual(visao.clientes[1]?.subBlocos[0]?.secoes, []);
  });

  it("marcar Retornou move para a lista do fim sem pedido e desmarcar devolve aos sub-blocos", () => {
    const pedidos = [
      pedido({ numPed: "10", codCli: "1", cliente: "Alpha", posCar: 1, gruposCodigo: ["HIPO"] }),
      pedido({ numPed: "20", codCli: "2", cliente: "Beta", posCar: 2, gruposCodigo: ["HIPO"] }),
    ];
    let itens = [item({ alocacaoIbcId: "h1", identificador: "HMH00001", grupoCodigo: "HIPO" })];

    itens = conciliacaoVolta.alternarDestino(itens, pedidos, "h1", "RETORNOU", "10");
    assert.equal(itens[0]?.numPed, null);
    assert.equal(itens[0]?.destino, "RETORNOU");

    const comRetorno = conciliacaoVolta.montarVisao({
      codCar: 383,
      expedicaoIbcId: "exp-1",
      viagemFechadaEm: null,
      chegaramAMais: 0,
      clientes: [],
      pedidos,
      itens,
    });
    assert.deepEqual(comRetorno.retornaram.map((i) => i.identificador), ["HMH00001"]);
    assert.deepEqual(comRetorno.clientes[0]?.subBlocos[0]?.secoes, []);
    assert.deepEqual(comRetorno.clientes[1]?.subBlocos[0]?.secoes, []);

    itens = conciliacaoVolta.alternarDestino(itens, pedidos, "h1", "RETORNOU", null);
    assert.equal(itens[0]?.destino, null);

    const desmarcado = conciliacaoVolta.montarVisao({
      codCar: 383,
      expedicaoIbcId: "exp-1",
      viagemFechadaEm: null,
      chegaramAMais: 0,
      clientes: [],
      pedidos,
      itens,
    });
    assert.deepEqual(desmarcado.retornaram, []);
    assert.equal(desmarcado.clientes[0]?.subBlocos[0]?.secoes[0]?.itens.length, 1);
    assert.equal(desmarcado.clientes[1]?.subBlocos[0]?.secoes[0]?.itens.length, 1);
  });

  it("interpreta Chegaram a mais vazio como zero e recusa negativo ou decimal", () => {
    assert.deepEqual(conciliacaoVolta.lerChegaramAMais(""), { ok: true, valor: 0 });
    assert.deepEqual(conciliacaoVolta.lerChegaramAMais("   "), { ok: true, valor: 0 });
    assert.deepEqual(conciliacaoVolta.lerChegaramAMais("0"), { ok: true, valor: 0 });
    assert.deepEqual(conciliacaoVolta.lerChegaramAMais("5"), { ok: true, valor: 5 });
    assert.deepEqual(conciliacaoVolta.lerChegaramAMais("-1"), { ok: false });
    assert.deepEqual(conciliacaoVolta.lerChegaramAMais("2.5"), { ok: false });
  });
});
