import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { RelatorioViagemDTO } from "../types/ibcExpedicao.types";
import {
  buildRelatorioViagemPdfLayout,
  type RelatorioViagemPdfItem,
} from "./buildRelatorioViagemPdfLayout";

const EMITIDO = new Date("2026-10-12T15:30:00.000Z");
const MARCAS = ["Ficou no cliente", "Retornou no caminhão", "Troca"] as const;

function relatorio(overrides: Partial<RelatorioViagemDTO> = {}): RelatorioViagemDTO {
  return {
    codCar: 202,
    fechadoEm: "2026-10-11T18:30:00.000Z",
    destino: "Blumenau",
    placa: "ABC1D23",
    totalIbcs: 2,
    totalClientes: 2,
    clientes: [
      {
        codCli: "B",
        cliente: "Beta",
        pedidos: [{ numPed: "12", quantidade: 3, modalidade: "Empréstimo" }],
        checklist: [{ identificador: "H0001" }, { identificador: "H0010" }],
      },
      {
        codCli: "A",
        cliente: "Acme",
        pedidos: [
          { numPed: "40", quantidade: 2, modalidade: "Embalagem Inclusa (Venda)" },
        ],
        checklist: [{ identificador: "H0001" }, { identificador: "H0010" }],
      },
    ],
    ...overrides,
  };
}

function textos(itens: RelatorioViagemPdfItem[]): Extract<RelatorioViagemPdfItem, { tipo: "texto" }>[] {
  return itens.filter((item) => item.tipo === "texto");
}

function textoIgual(itens: RelatorioViagemPdfItem[], valor: string) {
  const achado = textos(itens).find((item) => item.texto === valor);
  assert.ok(achado, valor);
  return achado;
}

describe("buildRelatorioViagemPdfLayout", () => {
  it("preserva a ordem dos clientes e do checklist e nomeia o arquivo", () => {
    const layout = buildRelatorioViagemPdfLayout(relatorio(), EMITIDO);
    const nomes = textos(layout.paginas[0].itens)
      .map((item) => item.texto)
      .filter((texto) => texto.startsWith("Beta") || texto.startsWith("Acme"));
    const ids = textos(layout.paginas.flatMap((pagina) => pagina.itens))
      .map((item) => item.texto)
      .filter((texto) => texto === "H0001" || texto === "H0010");

    assert.equal(layout.arquivo, "relatorio-viagem-202.pdf");
    assert.deepEqual(nomes, ["Beta (B)", "Acme (A)"]);
    assert.deepEqual(ids, ["H0001", "H0010", "H0001", "H0010"]);
  });

  it("monta a faixa, as colunas e as pautas, sem Reimpressão nem destino", () => {
    const layout = buildRelatorioViagemPdfLayout(relatorio({ placa: null, totalClientes: 2 }), EMITIDO);
    const pagina = layout.paginas[0];
    const unidos = textos(pagina.itens)
      .map((item) => item.texto)
      .join("\n");
    const data = textoIgual(pagina.itens, "Data: 11/10/2026");
    const carga = textoIgual(pagina.itens, "Carga: 202");
    const placa = textoIgual(pagina.itens, "Placa: —");
    const ibcs = textoIgual(pagina.itens, "Total de IBCs: 2");
    const clientes = textoIgual(pagina.itens, "Total de clientes: 2");
    const motorista = textoIgual(pagina.itens, "Motorista");
    const assinatura = textoIgual(pagina.itens, "Assinatura");
    const pedido = textoIgual(pagina.itens, "12");
    const quantidade = textoIgual(pagina.itens, "3");
    const modalidade = textoIgual(pagina.itens, "Empréstimo");
    const cabecalhoPedido = textoIgual(pagina.itens, "Pedido");
    const cabecalhoQuantidade = textoIgual(pagina.itens, "Quantidade");
    const cabecalhoModalidade = textoIgual(pagina.itens, "Modalidade");

    assert.equal(layout.paginas.length, 1);
    assert.equal(pagina.rodape, "Página 1 de 1 · Emitido em 12/10/2026 12:30");
    assert.ok(unidos.includes("Relatório de Viagem"));
    assert.equal(unidos.includes("Reimpressão"), false);
    assert.equal(unidos.includes("Blumenau"), false);
    assert.equal(unidos.includes("____"), false);
    assert.ok(data.y === carga.y && carga.y === placa.y);
    assert.ok(data.x < carga.x && carga.x < placa.x);
    assert.ok(ibcs.y === clientes.y && ibcs.y > data.y && ibcs.y - data.y <= 8);
    assert.equal(motorista.y, assinatura.y);
    assert.ok(motorista.x < assinatura.x && motorista.y > ibcs.y);

    const tracos = pagina.itens.filter((item) => item.tipo === "traco");
    const linhaMotorista = tracos.find((item) => item.papel === "motorista");
    const linhaAssinatura = tracos.find((item) => item.papel === "assinatura");
    assert.ok(linhaMotorista && linhaAssinatura);
    assert.equal(linhaMotorista.y, motorista.y);
    assert.equal(linhaAssinatura.y, assinatura.y);
    assert.ok(linhaMotorista.x1 > motorista.x);
    assert.ok(linhaMotorista.x2 <= linhaAssinatura.x1);
    assert.ok(linhaAssinatura.x2 > assinatura.x);

    assert.equal(pedido.y, quantidade.y);
    assert.equal(quantidade.y, modalidade.y);
    assert.ok(pedido.x < quantidade.x && quantidade.x < modalidade.x);
    assert.equal(cabecalhoPedido.x, pedido.x);
    assert.equal(cabecalhoQuantidade.x, quantidade.x);
    assert.equal(cabecalhoModalidade.x, modalidade.x);

    const marcas = MARCAS.map((marca) => textoIgual(pagina.itens, marca));
    assert.ok(marcas.every((marca) => marca.y === marcas[0].y && marca.alinhamento === "centro"));
    const passo = marcas[1].x - marcas[0].x;
    assert.ok(Math.abs(marcas[2].x - marcas[1].x - passo) < 0.05);
    assert.ok(passo > 40);

    const fileiraY = Math.min(
      ...pagina.itens.filter((item) => item.tipo === "caixa").map((item) => item.y),
    );
    const fileira = pagina.itens.filter((item) => item.tipo === "caixa" && item.y === fileiraY);
    assert.equal(fileira.length, 3);
    marcas.forEach((marca, indice) => {
      const caixa = fileira[indice];
      assert.ok(caixa && caixa.tipo === "caixa");
      assert.equal(caixa.tamanho, 5);
      assert.ok(Math.abs(caixa.x + caixa.tamanho / 2 - marca.x) < 0.05);
      assert.ok(caixa.y > marca.y);
    });

    assert.equal(tracos.filter((item) => item.papel === "pauta").length, 4);
    assert.equal(
      textos(pagina.itens).filter((item) => item.texto.startsWith("Retornos sem identificação")).length,
      2,
    );
  });

  it("flui os clientes na mesma página e repete o cliente ao quebrar o checklist", () => {
    const curto = buildRelatorioViagemPdfLayout(relatorio(), EMITIDO);
    const yBeta = textos(curto.paginas[0].itens).find((item) => item.texto.startsWith("Beta"))?.y;
    const yAcme = textos(curto.paginas[0].itens).find((item) => item.texto.startsWith("Acme"))?.y;
    assert.equal(curto.paginas.length, 1);
    assert.ok(yBeta != null && yAcme != null && yAcme > yBeta);

    const checklist = Array.from({ length: 45 }, (_, indice) => ({
      identificador: `IBC-${indice + 1}`,
    }));
    const longo = buildRelatorioViagemPdfLayout(
      relatorio({
        totalIbcs: 45,
        totalClientes: 1,
        clientes: [
          {
            codCli: null,
            cliente: "Beta",
            pedidos: [{ numPed: "12", quantidade: 1, modalidade: "Empréstimo" }],
            checklist,
          },
        ],
      }),
      EMITIDO,
    );

    assert.ok(longo.paginas.length >= 2);
    assert.equal(longo.paginas[0].rodape, `Página 1 de ${longo.paginas.length} · Emitido em 12/10/2026 12:30`);
    const segunda = longo.paginas[1];
    assert.equal(segunda.itens[0]?.tipo === "texto" ? segunda.itens[0].texto : "", "Beta");
    assert.equal(segunda.itens[0]?.y, longo.paginas[0].itens[0]?.y);
    const indiceCabecalho = segunda.itens.findIndex(
      (item) => item.tipo === "texto" && item.texto === "Ficou no cliente",
    );
    const indiceCaixa = segunda.itens.findIndex((item) => item.tipo === "caixa");
    assert.ok(indiceCabecalho >= 0 && indiceCaixa > indiceCabecalho);

    const ids = textos(longo.paginas.flatMap((pagina) => pagina.itens))
      .map((item) => item.texto)
      .filter((texto) => texto.startsWith("IBC-"));
    assert.deepEqual(
      ids,
      checklist.map((item) => item.identificador),
    );
  });
});
