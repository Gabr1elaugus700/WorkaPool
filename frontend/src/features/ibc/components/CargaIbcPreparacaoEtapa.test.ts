import assert from "node:assert/strict";
import { describe, it } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import CargaIbcPreparacaoEtapa from "./CargaIbcPreparacaoEtapa";
import type { AlocacaoIbcDTO, CargaExpedicaoDetalheDTO, ContainersCargaDTO, PedidoIbcPreparacaoDTO } from "../types/ibcExpedicao.types";

function pedido(
  numPed: string,
  overrides: Partial<PedidoIbcPreparacaoDTO> = {},
): PedidoIbcPreparacaoDTO {
  return {
    numPed,
    cliente: "Cliente",
    quantidadeAlocada: 0,
    quantidadeEsperadaTotal: 2,
    quantidadeEsperadaVenda: 2,
    quantidadeEsperadaEmprestimo: 0,
    ibcInvalido: false,
    alocacoes: [],
    ...overrides,
  };
}

function alocacao(id: string, identificador: string): AlocacaoIbcDTO {
  return {
    id,
    ibcId: id,
    cargaId: "carga-1",
    numPed: null,
    alocadoPorId: "almox",
    alocadoEm: "2026-10-19T12:00:00.000Z",
    expedicaoIbcId: null,
    identificador,
  };
}

function detalhe(overrides: Partial<CargaExpedicaoDetalheDTO> = {}): CargaExpedicaoDetalheDTO {
  return {
    id: "carga-1",
    codCar: 101,
    destino: "Blumenau",
    situacao: "FECHADA",
    previsaoSaida: "2026-10-20T10:00:00.000Z",
    quantidadeAlocada: 1,
    quantidadeEsperadaTotal: 2,
    temExpedicao: false,
    podeFecharExpedicao: false,
    pedidos: [pedido("1120")],
    alocacoes: [alocacao("a2", "H10"), alocacao("a1", "H2")],
    avisos: [],
    ...overrides,
  };
}

function paletaDaCarga(item: CargaExpedicaoDetalheDTO): ContainersCargaDTO {
  return {
    grupos: [{ grupoCodigo: "CLORO", sigla: "CL", corHex: "#00aa00", grupoDescricao: "Hipoclorito" }],
    vinculados: item.alocacoes.map((alocacao) => ({
      identificador: alocacao.identificador,
      alocacaoId: alocacao.id,
      grupoCodigo: "CLORO",
      corHex: "#00aa00",
      universal: false,
      homologado: true,
    })),
    disponiveis: [
      {
        identificador: "H20",
        alocacaoId: null,
        grupoCodigo: "CLORO",
        corHex: "#00aa00",
        universal: false,
        homologado: true,
      },
    ],
  };
}

function html(
  item: CargaExpedicaoDetalheDTO,
  mutationsLocked = false,
  extras: { paletaErro?: string | null; anuncio?: string | null; semPaleta?: boolean } = {},
): string {
  return renderToStaticMarkup(
    React.createElement(CargaIbcPreparacaoEtapa, {
      detalhe: item,
      mutationsLocked,
      substituidoNotice: null,
      paleta: extras.semPaleta ? null : paletaDaCarga(item),
      paletaCarregando: false,
      paletaErro: extras.paletaErro ?? null,
      anuncio: extras.anuncio ?? null,
      onRecarregarPaleta: () => undefined,
      onAllocate: async () => true,
      onDeallocate: async () => undefined,
    }),
  );
}

describe("CargaIbcPreparacaoEtapa", () => {
  it("lista a carga, a barra contra o total e o vínculo sem pedido", () => {
    const markup = html(detalhe());

    assert.match(markup, /Containers vinculados/);
    assert.match(markup, /1\/2/);
    assert.match(markup, /aria-valuenow="1"/);
    assert.match(markup, /aria-valuemax="2"/);
    assert.match(markup, /width:50%/);
    assert.match(markup, /H2/);
    assert.match(markup, /H10/);
    assert.ok(markup.indexOf("H2") < markup.indexOf("H10"));
    assert.match(markup, /Na carga/);
    assert.match(markup, /aria-label="H2, Vinculado"/);
    assert.match(markup, /Buscar mais containers/);
    assert.match(markup, /w-full/);
    assert.match(markup, /border-dashed/);
    assert.match(markup, /hover:border-primary/);
    assert.match(markup, /hover:bg-primary\/10/);
    assert.match(markup, /hover:text-primary/);
    assert.match(markup, /focus-visible:border-primary/);
    assert.match(markup, /tabular-nums text-foreground/);
    assert.match(markup, /CLORO · CL Hipoclorito/);
    assert.doesNotMatch(markup, /ibc-identificador-carga/);
    assert.doesNotMatch(markup, /Pedido 1120/);
    assert.doesNotMatch(markup, /Venda:/);
    assert.doesNotMatch(markup, /<select/);
  });

  it("mostra o pedido misto como alerta fora do total, sem cota para preencher", () => {
    const markup = html(
      detalhe({
        quantidadeEsperadaTotal: 2,
        pedidos: [
          pedido("1120"),
          pedido("9000", {
            cliente: "Misto Ltda",
            quantidadeEsperadaTotal: 6,
            quantidadeEsperadaVenda: 3,
            quantidadeEsperadaEmprestimo: 3,
          }),
        ],
      }),
    );

    assert.match(markup, /Pedido misto fora do total/);
    assert.match(markup, /não é cota para vincular/);
    assert.match(markup, /Pedido 9000 · Misto Ltda/);
    assert.doesNotMatch(markup, /Pedido 1120/);
    assert.doesNotMatch(markup, /Venda:/);
    assert.doesNotMatch(markup, /Empréstimo:/);
  });

  it("recolhe a paleta quando a quantidade esperada está completa", () => {
    const um = html(detalhe({
      quantidadeAlocada: 1,
      quantidadeEsperadaTotal: 1,
      alocacoes: [alocacao("a1", "H2")],
    }));

    assert.match(um, /A quantidade esperada da carga está completa\. Toque no container vinculado para trocá-lo\./);
    assert.match(um, /<button[^>]*aria-label="H2, Vinculado"/);
    assert.match(um, /width:100%/);
    assert.match(um, /tabular-nums text-foreground/);
    assert.doesNotMatch(um, /já está vinculada/);
    assert.doesNotMatch(um, /Buscar mais containers/);
    assert.doesNotMatch(um, /H20/);
    assert.doesNotMatch(um, /text-emerald-700/);

    const varios = html(detalhe({ quantidadeAlocada: 2, quantidadeEsperadaTotal: 2 }));
    assert.match(varios, /Toque em um container vinculado para trocá-lo\./);
  });

  it("deixa a barra vazia e o contador muted quando nada está vinculado", () => {
    const markup = html(detalhe({
      quantidadeAlocada: 0,
      quantidadeEsperadaTotal: 1,
      alocacoes: [],
    }));

    assert.match(markup, /0\/1/);
    assert.match(markup, /width:0%/);
    assert.match(markup, /tabular-nums text-muted-foreground/);
    assert.match(markup, /bg-primary/);
  });

  it("alerta o pedido inválido e esconde vincular e desvincular com a expedição fechada", () => {
    const markup = html(
      detalhe({
        temExpedicao: true,
        quantidadeAlocada: 2,
        quantidadeEsperadaTotal: 2,
        pedidos: [
          pedido("1121", {
            ibcInvalido: true,
            quantidadeEsperadaTotal: 0,
            quantidadeEsperadaVenda: 0,
            quantidadeEsperadaEmprestimo: 0,
          }),
        ],
      }),
      true,
    );

    assert.match(markup, /Pedido IBC inválido fora do total/);
    assert.match(markup, /Pedido 1121/);
    assert.match(markup, /Os vínculos são só consulta/);
    assert.doesNotMatch(markup, /está completa/);
    assert.doesNotMatch(markup, /Buscar mais containers/);
    assert.doesNotMatch(markup, /H20/);
    assert.match(markup, /<span[^>]*aria-label="H2, Vinculado"/);
  });

  it("mostra o grupo sem configuração e deixa claro que a carga segue", () => {
    const markup = html(
      detalhe({
        avisos: [{
          code: "IBC_PEDIDO_GRUPO_SEM_CONFIG",
          numPed: "1120",
          gruposCodigo: ["SODA"],
          message: "Pedido 1120: grupo SODA não tem configuração de placa. Só o container universal atende.",
        }],
      }),
    );

    assert.match(markup, /Grupo sem configuração de placa e cor/);
    assert.match(markup, /Pedido 1120: grupo SODA não tem configuração de placa/);
    assert.match(markup, /A carga segue/);
    assert.match(markup, /Buscar mais containers/);
  });

  it("mostra o erro da paleta com tentar de novo e anuncia o vínculo", () => {
    const markup = html(detalhe(), false, {
      paletaErro: "Falha ao carregar containers",
      anuncio: "H2 vinculado à carga",
      semPaleta: true,
    });

    assert.match(markup, /Falha ao carregar containers/);
    assert.match(markup, /Tentar de novo/);
    assert.match(markup, /aria-live="polite"/);
    assert.match(markup, /H2 vinculado à carga/);
    assert.doesNotMatch(markup, /Buscar mais containers/);
  });
});
