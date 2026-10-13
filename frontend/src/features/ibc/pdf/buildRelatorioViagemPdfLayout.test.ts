import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { RelatorioViagemDTO } from "../types/ibcExpedicao.types";
import { buildRelatorioViagemPdfLayout } from "./buildRelatorioViagemPdfLayout";

const EMITIDO = new Date("2026-10-12T15:30:00.000Z");

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

function textos(layout: ReturnType<typeof buildRelatorioViagemPdfLayout>): string[] {
  return layout.paginas.flatMap((pagina) =>
    pagina.linhas.flatMap((linha) => (linha.tipo === "texto" ? [linha.texto] : [])),
  );
}

describe("buildRelatorioViagemPdfLayout", () => {
  it("preserva a ordem dos clientes e do checklist e nomeia o arquivo", () => {
    const layout = buildRelatorioViagemPdfLayout(relatorio(), EMITIDO);
    const nomes = textos(layout).filter((texto) => texto.startsWith("Beta") || texto.startsWith("Acme"));
    const checklist = layout.paginas[0].linhas.filter((linha) => linha.tipo === "checklist");

    assert.equal(layout.arquivo, "relatorio-viagem-202.pdf");
    assert.deepEqual(nomes, ["Beta (B)", "Acme (A)"]);
    assert.deepEqual(
      checklist.map((linha) => linha.identificador),
      ["H0001", "H0010", "H0001", "H0010"],
    );
  });

  it("monta cabeçalho, três marcas e duas linhas de observação, sem Reimpressão", () => {
    const layout = buildRelatorioViagemPdfLayout(relatorio({ placa: null, totalClientes: 2 }), EMITIDO);
    const pagina = layout.paginas[0];
    const cabecalho = pagina.linhas.find((linha) => linha.tipo === "checklist-cabecalho");
    const check = pagina.linhas.find((linha) => linha.tipo === "checklist");
    const unidos = textos(layout).join("\n");

    assert.equal(layout.paginas.length, 1);
    assert.equal(pagina.rodape, "Página 1 de 1 · Emitido em 12/10/2026 12:30");
    assert.ok(unidos.includes("Relatório de Viagem"));
    assert.ok(unidos.includes("Data: 11/10/2026"));
    assert.ok(unidos.includes("Carga: 202"));
    assert.ok(unidos.includes("Placa: —"));
    assert.ok(unidos.includes("Total de IBCs: 2"));
    assert.ok(unidos.includes("Total de clientes: 2"));
    assert.ok(unidos.includes("Motorista: ____"));
    assert.ok(unidos.includes("Assinatura: ____"));
    assert.ok(unidos.includes("12    3    Empréstimo"));
    assert.equal(unidos.includes("Reimpressão"), false);
    assert.equal(unidos.includes("Blumenau"), false);
    assert.deepEqual(cabecalho && cabecalho.tipo === "checklist-cabecalho" ? cabecalho.colunas : [], [
      "Ficou no cliente",
      "Retornou no caminhão",
      "Troca",
    ]);
    assert.deepEqual(check ? Object.keys(check).sort() : [], ["identificador", "tipo", "y"]);
    assert.equal(pagina.linhas.filter((linha) => linha.tipo === "observacao").length, 4);
    assert.equal(
      textos(layout).filter((texto) => texto.startsWith("Retornos sem identificação")).length,
      2,
    );
  });

  it("flui os clientes na mesma página e só quebra quando o espaço acaba", () => {
    const curto = buildRelatorioViagemPdfLayout(relatorio(), EMITIDO);
    const yBeta = curto.paginas[0].linhas.find(
      (linha) => linha.tipo === "texto" && linha.texto.startsWith("Beta"),
    )?.y;
    const yAcme = curto.paginas[0].linhas.find(
      (linha) => linha.tipo === "texto" && linha.texto.startsWith("Acme"),
    )?.y;
    assert.equal(curto.paginas.length, 1);
    assert.ok(yBeta != null && yAcme != null && yAcme > yBeta);
    assert.ok(yAcme > 16);

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
    assert.equal(longo.paginas[1].linhas[0].tipo, "checklist-cabecalho");
    assert.equal(longo.paginas[1].linhas[0].y, 16);
    const idsPagina2 = longo.paginas[1].linhas.filter((linha) => linha.tipo === "checklist");
    assert.equal(idsPagina2[0]?.identificador, "IBC-41");
    const ultima = longo.paginas.at(-1)?.linhas.filter((linha) => linha.tipo === "checklist").at(-1);
    assert.equal(ultima?.identificador, "IBC-45");
  });
});
