import { Download } from "lucide-react";
import * as XLSX from "xlsx";
import { Seller } from "../types/orderLoss.types";

type FilterType = "all" | "pending" | "justified";

interface ExportButtonProps {
  filteredSellers: Seller[];
  activeFilter: FilterType;
}

export default function ExportButton({
  filteredSellers,
  activeFilter,
}: ExportButtonProps) {
  const exportToExcel = () => {
    // Mapeamento de códigos para português
    const getReasonLabel = (code: string | undefined) => {
      if (!code) return "Não justificado";

      const labels: Record<string, string> = {
        FREIGHT: "Frete",
        PRICE: "Preço",
        MARGIN: "Margem",
        STOCK: "Estoque",
        OTHER: "Outros",
      };
      return labels[code] || code;
    };

    // Preparar dados para exportação
    interface ExportRow {
      "Numero do Pedido": string;
      Vendedor: string;
      Data: string;
      Cliente: string;
      "Cidade - Estado": string;
      Produto: string;
      "Valor Unitário": number;
      "Valor Total": number;
      "Margem (%)": string;
      "Peso Total": number;
      Motivo: string;
      "Descrição da Justificativa": string;
      Justificado: string;
      "Data da Justificativa": string;
    }

    const exportData: ExportRow[] = [];

    filteredSellers.forEach((seller) => {
      seller.orders.forEach((order) => {
        order.products.forEach((product) => {
          exportData.push({
            "Numero do Pedido": order.orderNumber,
            Vendedor: seller.name,
            Data: new Date(order.createdAt).toLocaleDateString("pt-BR"),
            Cliente: order.clientName,
            "Cidade - Estado": order.city,
            Produto: product.name,
            "Valor Unitário": product.unitPrice,
            "Valor Total": product.totalPrice,
            "Margem (%)": product.margin.toFixed(2),
            "Peso Total": product.weight,
            Motivo: getReasonLabel(order.lossReasonDetail?.code),
            "Descrição da Justificativa":
              order.lossReasonDetail?.description || "-",
            Justificado: order.lossReasonDetail ? "Sim" : "Não",
            "Data da Justificativa": order.lossReasonDetail?.submittedAt
              ? new Date(order.lossReasonDetail.submittedAt).toLocaleDateString(
                  "pt-BR",
                )
              : "-",
          });
        });
      });
    });

    // Ordenar por data (do mais antigo para o mais recente)
    exportData.sort((a, b) => {
      const dateA = a.Data.split("/").reverse().join("-"); // Converte DD/MM/YYYY para YYYY-MM-DD
      const dateB = b.Data.split("/").reverse().join("-");
      return dateA.localeCompare(dateB);
    });

    console.log("📊 Exportando dados:", {
      totalLinhas: exportData.length,
      primeiraLinha: exportData[0],
      vendedoresUnicos: [...new Set(exportData.map((d) => d.Vendedor))],
    });

    // Criar workbook e worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Ajustar largura das colunas
    const columnWidths = [
      { wch: 20 }, // Vendedor
      { wch: 12 }, // ID Pedido
      { wch: 12 }, // Data
      { wch: 30 }, // Cliente
      { wch: 15 }, // Valor Total
      { wch: 12 }, // Margem
      { wch: 12 }, // Peso Total
      { wch: 20 }, // Motivo
      { wch: 50 }, // Descrição
      { wch: 12 }, // Justificado
      { wch: 20 }, // Justificado Por
      { wch: 18 }, // Data Justificativa
    ];
    ws["!cols"] = columnWidths;

    // Adicionar worksheet ao workbook
    XLSX.utils.book_append_sheet(wb, ws, "Pedidos Perdidos");

    // Gerar arquivo e fazer download
    const filterName =
      activeFilter === "all"
        ? "todos"
        : activeFilter === "pending"
          ? "pendentes"
          : "justificados";
    const fileName = `pedidos-perdidos-${filterName}-${new Date().toISOString().split("T")[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  return (
    <button
      onClick={exportToExcel}
      className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg border border-green-700 hover:bg-green-200 transition-colors font-medium shadow-sm"
    >
      <Download size={18} />
      Exportar Excel
    </button>
  );
}
