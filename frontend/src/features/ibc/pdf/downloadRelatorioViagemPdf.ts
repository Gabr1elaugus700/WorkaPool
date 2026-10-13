import type { jsPDF } from "jspdf";
import type { RelatorioViagemDTO } from "../types/ibcExpedicao.types";
import {
  buildRelatorioViagemPdfLayout,
  type RelatorioViagemPdfLinha,
} from "./buildRelatorioViagemPdfLayout";

const MARGIN_X = 14;
const COLUNAS_X = [46, 108, 168];
const CAIXA = 3.2;

function desenharTexto(doc: jsPDF, linha: Extract<RelatorioViagemPdfLinha, { tipo: "texto" }>) {
  doc.setFont("helvetica", linha.negrito ? "bold" : "normal");
  doc.setFontSize(linha.tamanho);
  if (linha.texto) doc.text(linha.texto, MARGIN_X, linha.y);
}

function desenharCabecalho(
  doc: jsPDF,
  linha: Extract<RelatorioViagemPdfLinha, { tipo: "checklist-cabecalho" }>,
) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("IBC", MARGIN_X, linha.y);
  linha.colunas.forEach((coluna, indice) => {
    doc.text(coluna, COLUNAS_X[indice] ?? MARGIN_X, linha.y);
  });
}

function desenharChecklist(
  doc: jsPDF,
  linha: Extract<RelatorioViagemPdfLinha, { tipo: "checklist" }>,
  colunas: readonly string[],
) {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(linha.identificador, MARGIN_X, linha.y);
  colunas.forEach((_, indice) => {
    const x = COLUNAS_X[indice] ?? MARGIN_X;
    doc.rect(x, linha.y - CAIXA, CAIXA, CAIXA);
  });
}

function desenhar(doc: jsPDF, linhas: RelatorioViagemPdfLinha[], rodape: string) {
  const colunas =
    linhas.find((linha) => linha.tipo === "checklist-cabecalho")?.colunas ?? [];
  for (const linha of linhas) {
    if (linha.tipo === "texto") desenharTexto(doc, linha);
    else if (linha.tipo === "checklist-cabecalho") desenharCabecalho(doc, linha);
    else if (linha.tipo === "checklist") desenharChecklist(doc, linha, colunas);
    else doc.line(MARGIN_X, linha.y, 196, linha.y);
  }
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(rodape, MARGIN_X, 290);
}

export async function downloadRelatorioViagemPdf(
  relatorio: RelatorioViagemDTO,
  emitidoEm: Date = new Date(),
): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const layout = buildRelatorioViagemPdfLayout(relatorio, emitidoEm);
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  layout.paginas.forEach((pagina, indice) => {
    if (indice > 0) doc.addPage();
    desenhar(doc, pagina.linhas, pagina.rodape);
  });
  doc.save(layout.arquivo);
}
