import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { RelatorioViagemDTO } from "../types/ibcExpedicao.types";
import {
  buildRelatorioViagemPdfLayout,
  type RelatorioViagemPdfItem,
} from "./buildRelatorioViagemPdfLayout";

const EMITIDO = new Date("2026-10-12T15:30:00.000Z");
const MARCAS = ["Ficou no cliente", "Troca", "Retorno"] as const;
const LISTA = [
  { identificador: "H0001", produto: "Hipoclorito" },
  { identificador: "H0010", produto: null },
] as const;

function relatorio(overrides: Partial<RelatorioViagemDTO> = {}): RelatorioViagemDTO {
  return {
    codCar: 202,
    fechadoEm: "2026-10-11T18:30:00.000Z",
    destino: "Blumenau",
    placa: "ABC1D23",
    totalIbcs: 2,
    totalClientes: 2,
    blocos: [
      {
        codCli: "B",
        cliente: "Beta",
        numPed: "12",
        quantidadeEsperada: 3,
        incluso: false,
        checklist: [...LISTA],
      },
      {
        codCli: "A",
        cliente: "Acme",
        numPed: "40",
        quantidadeEsperada: 2,
        incluso: true,
        checklist: [...LISTA],
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
      .filter((texto) => texto.startsWith("H0001") || texto.startsWith("H0010"));

    assert.equal(layout.arquivo, "relatorio-viagem-202.pdf");
    assert.deepEqual(nomes, ["Beta (B)", "Acme (A)"]);
    assert.deepEqual(ids, [
      "H0001 - Hipoclorito",
      "H0010",
      "H0001 - Hipoclorito",
      "H0010",
    ]);
  });

  it("monta a faixa, as colunas e as pautas, sem Reimpressão", () => {
    const layout = buildRelatorioViagemPdfLayout(relatorio({ placa: "ABC1D23", totalClientes: 2 }), EMITIDO);
    const pagina = layout.paginas[0];
    const unidos = textos(pagina.itens)
      .map((item) => item.texto)
      .join("\n");
    const data = textoIgual(pagina.itens, "Data");
    const dataValor = textoIgual(pagina.itens, "12/10/2026");
    const carga = textoIgual(pagina.itens, "Carga");
    const codigoCarga = textoIgual(pagina.itens, "202");
    const destino = textoIgual(pagina.itens, "Blumenau");
    const placa = textoIgual(pagina.itens, "Placa");
    const ibcs = textoIgual(pagina.itens, "Total de IBCs");
    const ibcsValor = textoIgual(pagina.itens, "2");
    const clientes = textoIgual(pagina.itens, "Total de clientes");
    const motorista = textoIgual(pagina.itens, "Motorista");
    const assinatura = textoIgual(pagina.itens, "Assinatura");
    const pedido = textoIgual(pagina.itens, "Pedido 12");
    const quantidade = textoIgual(pagina.itens, "Quantidade 3");
    const nf = textoIgual(pagina.itens, "NF");

    assert.equal(layout.paginas.length, 1);
    assert.equal(pagina.rodape, "Página 1 de 1 · Emitido em 12/10/2026 12:30");
    assert.ok(unidos.includes("Relatório de Viagem"));
    assert.equal(unidos.includes("Reimpressão"), false);
    assert.equal(unidos.includes("ABC1D23"), false);
    assert.ok(data.y === placa.y && placa.y === ibcs.y && ibcs.y === clientes.y);
    assert.ok(data.x < placa.x && placa.x < ibcs.x && ibcs.x < clientes.x);
    assert.equal(dataValor.y, ibcsValor.y);
    assert.ok(dataValor.y > data.y);
    assert.ok(carga.x > clientes.x && codigoCarga.x === carga.x && destino.x === carga.x);
    assert.ok(carga.y < codigoCarga.y && codigoCarga.y < destino.y && destino.y < data.y);
    assert.equal(motorista.y, assinatura.y);
    assert.ok(motorista.x < assinatura.x && motorista.y > dataValor.y);
    const molduras = pagina.itens.filter((item) => item.tipo === "moldura");
    assert.equal(molduras.length, 2);
    const verticais = pagina.itens.filter((item) => item.tipo === "vertical");
    assert.equal(verticais.length, 3);

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
    assert.equal(pedido.y, nf.y);
    assert.ok(pedido.x < quantidade.x && quantidade.x < nf.x);
    const linhaNf = tracos.filter((item) => item.papel === "nf");
    assert.equal(linhaNf.length >= 1, true);
    assert.ok(linhaNf.some((item) => item.y === pedido.y));
    assert.equal(unidos.includes("Empréstimo"), false);
    assert.equal(unidos.includes("Modalidade"), false);
    assert.equal(unidos.includes("Transbordo"), false);
    assert.equal(unidos.includes("Retornou"), false);

    const marcas = MARCAS.map((marca) => textoIgual(pagina.itens, marca));
    assert.equal(marcas.length, 3);
    assert.ok(marcas.every((marca) => marca.y === marcas[0].y && marca.alinhamento === "centro"));
    assert.ok(marcas[1].x - marcas[0].x > 20);

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

    const inclusos = textos(pagina.itens).filter((item) => item.texto === "Incluso");
    assert.equal(inclusos.length, 2);
    for (const badge of inclusos) {
      assert.equal(badge.negrito, true);
      assert.equal(badge.alinhamento, "centro");
      const linha = pagina.itens.filter((item) => item.y === badge.y);
      const identificador = linha.find(
        (item) => item.tipo === "texto" && (item.texto.startsWith("H0001") || item.texto.startsWith("H0010")),
      );
      const selo = linha.find((item) => item.tipo === "selo");
      const caixas = linha.filter((item) => item.tipo === "caixa");
      assert.ok(identificador && identificador.tipo === "texto");
      assert.ok(selo && selo.tipo === "selo");
      assert.equal(caixas.length, 3);
      assert.ok(selo.x > identificador.x);
      assert.ok(badge.x > selo.x && badge.x < selo.x + selo.largura);
      assert.ok(caixas.every((caixa) => caixa.tipo === "caixa" && caixa.x > selo.x + selo.largura));
    }
    const yEmprestimo = textoIgual(pagina.itens, "H0001 - Hipoclorito").y;
    assert.equal(
      pagina.itens.some(
        (item) => item.y === yEmprestimo && (item.tipo === "selo" || (item.tipo === "texto" && item.texto === "Incluso")),
      ),
      false,
    );

    assert.equal(tracos.filter((item) => item.papel === "pauta").length, 4);
  });

  it("flui os clientes na mesma página e repete o cliente ao quebrar o checklist", () => {
    const curto = buildRelatorioViagemPdfLayout(relatorio(), EMITIDO);
    const yBeta = textos(curto.paginas[0].itens).find((item) => item.texto.startsWith("Beta"))?.y;
    const yAcme = textos(curto.paginas[0].itens).find((item) => item.texto.startsWith("Acme"))?.y;
    assert.equal(curto.paginas.length, 1);
    assert.ok(yBeta != null && yAcme != null && yAcme > yBeta);

    const checklist = Array.from({ length: 45 }, (_, indice) => ({
        identificador: `IBC-${indice + 1}`,
        produto: null,
    }));
    const longo = buildRelatorioViagemPdfLayout(
      relatorio({
        totalIbcs: 45,
        totalClientes: 1,
        blocos: [
          {
            codCli: null,
            cliente: "Beta",
            numPed: "12",
            quantidadeEsperada: 1,
            incluso: false,
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
