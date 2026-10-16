import type { jsPDF } from "jspdf";
import type { RelatorioViagemDTO } from "../types/ibcExpedicao.types";
import {
  buildRelatorioViagemPdfLayout,
  type RelatorioViagemPdfItem,
} from "./buildRelatorioViagemPdfLayout";

const LARGURA_TRACO: Record<Extract<RelatorioViagemPdfItem, { tipo: "traco" }>["papel"], number> = {
  fio: 0.2,
  motorista: 0.35,
  assinatura: 0.35,
  retorno: 0.35,
  pauta: 0.3,
};

function desenharTexto(doc: jsPDF, item: Extract<RelatorioViagemPdfItem, { tipo: "texto" }>) {
  doc.setFont("helvetica", item.negrito ? "bold" : "normal");
  doc.setFontSize(item.tamanho);
  doc.text(item.texto, item.x, item.y, {
    align: item.alinhamento === "centro" ? "center" : "left",
  });
}

function desenhar(doc: jsPDF, itens: RelatorioViagemPdfItem[], rodape: string) {
  doc.setDrawColor(0);
  doc.setTextColor(0);
  for (const item of itens) {
    if (item.tipo === "texto") {
      desenharTexto(doc, item);
    } else if (item.tipo === "caixa") {
      doc.setLineWidth(0.4);
      doc.rect(item.x, item.y - item.tamanho + 1, item.tamanho, item.tamanho);
    } else {
      doc.setLineWidth(LARGURA_TRACO[item.papel]);
      doc.line(item.x1, item.y, item.x2, item.y);
    }
  }
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(rodape, 14, 290);
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
    desenhar(doc, pagina.itens, pagina.rodape);
  });
  doc.save(layout.arquivo);
}
