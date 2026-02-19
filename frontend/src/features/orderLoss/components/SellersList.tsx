import { useState } from "react";
import { Seller, LegacyOrder } from "../types/orderLoss.types";
import {
  ChevronDown,
  ChevronRight,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { OrderDetailsModal } from "./OrderDetailsModal";

interface SellersListProps {
  sellers: Seller[];
}

type FilterType = "all" | "price" | "stock" | "competition";

export const SellersList: React.FC<SellersListProps> = ({ sellers }) => {
  const [selectedOrder, setSelectedOrder] = useState<LegacyOrder | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedSellerId, setExpandedSellerId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  const handleOrderClick = (order: LegacyOrder) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedOrder(null), 200);
  };

  const toggleExpanded = (sellerId: string) => {
    if (expandedSellerId === sellerId) {
      setExpandedSellerId(null);
      setActiveFilter("all");
    } else {
      setExpandedSellerId(sellerId);
      setActiveFilter("all");
    }
  };

  const getMainReason = (orders: LegacyOrder[]) => {
    const reasonCounts: Record<string, number> = {};
    orders.forEach((order) => {
      if (order.lossReasonDetail?.code) {
        reasonCounts[order.lossReasonDetail.code] =
          (reasonCounts[order.lossReasonDetail.code] || 0) + 1;
      }
    });

    const sortedReasons = Object.entries(reasonCounts).sort(
      (a, b) => b[1] - a[1],
    );
    return sortedReasons.length > 0 ? sortedReasons[0][0] : null;
  };

  const getReasonBadge = (reason: string | null) => {
    if (!reason) return null;
    // FREIGHT // Frete
    // PRICE // Preço
    // MARGIN // Margem
    // STOCK // Estoque
    // OTHER // Outro
    const reasonUpper = reason.toUpperCase();

    if (reasonUpper.includes("PREÇO") || reasonUpper.includes("PRICE")) {
      return (
        <span className="px-3 py-1 rounded-full bg-red-50  text-red-600 text-sm font-medium">
          PREÇO
        </span>
      );
    }
    if (reasonUpper.includes("ESTOQUE") || reasonUpper.includes("STOCK")) {
      return (
        <span className="px-3 py-1 rounded-full bg-yellow-50 text-yellow-600 text-sm font-medium">
          PREÇO
        </span>
      );
    }
    if (reasonUpper.includes("MARGEM") || reasonUpper.includes("MARGIN")) {
      return (
        <span className="px-3 py-1 rounded-full bg-green-50 text-green-600 text-sm font-medium">
          MARGEM
        </span>
      );
    }
    if (reasonUpper.includes("OUTROS") || reasonUpper.includes("OTHER")) {
      return (
        <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-sm font-medium">
          CONCORRÊNCIA
        </span>
      );
    }
    if (reasonUpper.includes("FRETE") || reasonUpper.includes("FREIGHT")) {
      return (
        <span className="px-3 py-1 rounded-full bg-purple-50 text-purple-600 text-sm font-medium">
          FRETE
        </span>
      );
    }

    return (
      <span className="px-3 py-1 rounded-full bg-gray-50 text-gray-600 text-sm font-medium">
        {reason.toUpperCase()}
      </span>
    );
  };

  const getAverageMargin = (orders: LegacyOrder[]) => {
    if (orders.length === 0) return 0;
    const totalMargin = orders.reduce(
      (sum, order) => sum + order.averageMargin,
      0,
    );
    return totalMargin / orders.length;
  };

  const formatMargin = (margin: number) => {
    return `${margin.toFixed(1)}%`;
  };

  const getJustificationStatus = (order: LegacyOrder) => {
    if (
      order.lossReasonDetail?.code &&
      order.lossReasonDetail.description.trim() !== ""
    ) {
      return (
        <div className="flex items-center justify-center gap-1 text-green-600">
          <CheckCircle size={18} className="fill-green-100" />
        </div>
      );
    }
    return (
      <div className="flex items-center justify-center gap-1 text-red-600">
        <AlertCircle size={18} className="fill-red-100" />
      </div>
    );
  };

  const getClientInitials = (clientName: string) => {
    const words = clientName.split(" ");
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return clientName.substring(0, 2).toUpperCase();
  };

  const getClientAvatarColor = (clientName: string) => {
    const colors = [
      "bg-blue-500",
      "bg-pink-500",
      "bg-purple-500",
      "bg-green-500",
      "bg-orange-500",
      "bg-teal-500",
    ];
    const hash = clientName
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
      .format(date)
      .replace(".", ",");
  };

  const filterOrders = (orders: LegacyOrder[]) => {
    if (activeFilter === "all") return orders;

    return orders.filter((order) => {
      if (!order.lossReason) return false;
      const reasonUpper = order.lossReason.toUpperCase();

      if (activeFilter === "price") {
        return reasonUpper.includes("PREÇO") || reasonUpper.includes("PRICE");
      }
      if (activeFilter === "stock") {
        return reasonUpper.includes("ESTOQUE") || reasonUpper.includes("STOCK");
      }
      if (activeFilter === "competition") {
        return (
          reasonUpper.includes("CONCORRÊNCIA") ||
          reasonUpper.includes("CONCORRENCIA")
        );
      }
      return true;
    });
  };

  return (
    <>
      <div className="w-full">
        {/* Header da Tabela */}
        <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 text-gray-600 font-medium text-sm uppercase tracking-wide">
          <div className="col-span-3">Vendedor</div>
          <div className="col-span-2 text-center">Pedidos</div>
          <div className="col-span-2 text-center">Valor Total</div>
          <div className="col-span-2 text-center">Motivo Principal</div>
          <div className="col-span-2 text-center">Margem Média</div>
          <div className="col-span-1"></div>
        </div>

        {/* Lista de Vendedores */}
        <div className="flex flex-col gap-2">
          {sellers.map((seller) => {
            const isExpanded = expandedSellerId === seller.id;
            const totalValue = seller.orders.reduce(
              (sum, order) => sum + order.totalValue,
              0,
            );
            const mainReason = getMainReason(seller.orders);
            const averageMargin = getAverageMargin(seller.orders);
            const filteredOrders = filterOrders(seller.orders);

            return (
              <div
                key={seller.id}
                className={`rounded-lg overflow-hidden transition-all ${isExpanded ? "border-2 border-black shadow-lg" : "border border-gray-200"}`}
              >
                {/* Linha Principal */}
                <div
                  className="grid grid-cols-12 gap-4 px-6 py-4 bg-white hover:bg-gray-50 cursor-pointer items-center transition-colors"
                  onClick={() => toggleExpanded(seller.id)}
                >
                  {/* Vendedor */}
                  <div className="col-span-3 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-semibold">
                      {seller.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {seller.name}
                      </h3>
                      <p className="text-sm text-gray-500"></p>
                    </div>
                  </div>

                  {/* Pedidos */}
                  <div className="col-span-2 text-center">
                    <span className="text-gray-900 font-medium">
                      {seller.orders.length}{" "}
                      {seller.orders.length === 1 ? "pedido" : "pedidos"}
                    </span>
                  </div>

                  {/* Valor Total */}
                  <div className="col-span-2 text-center">
                    <span className="text-gray-900 font-medium">
                      {formatCurrency(totalValue)}
                    </span>
                  </div>

                  {/* Motivo Principal */}
                  <div className="col-span-2 flex justify-center">
                    {getReasonBadge(mainReason)}
                  </div>

                  {/* Margem Média */}
                  <div className="col-span-2 flex justify-center">
                    <span className="text-gray-900 font-medium">
                      {formatMargin(averageMargin)}
                    </span>
                  </div>

                  {/* Ícone de Expansão */}
                  <div className="col-span-1 flex justify-end">
                    {isExpanded ? (
                      <ChevronDown size={20} />
                    ) : (
                      <ChevronRight size={20} />
                    )}
                  </div>
                </div>

                {/* Conteúdo Expandido */}
                {isExpanded && (
                  <div className="bg-white px-6 py-4 border-t border-gray-200">
                    {/* Filtros */}
                    <div className="flex items-end justify-between mb-4 col-span-5 w-full">
                      <span className="text-sm text-gray-500 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                        Mostrando últimos 30 dias
                        <div className="flex items-center justify-center gap-1 text-green-600">
                          <CheckCircle size={18} className="fill-green-100" />
                          Justificados
                        </div>
                        <div className="flex items-center justify-center gap-1 text-red-600">
                          <AlertCircle size={18} className="fill-red-100" />
                          Não Justificados
                        </div>
                      </span>
                    </div>

                    {/* Tabela de Pedidos */}
                    <div className="bg-white rounded-lg overflow-hidden">
                      {/* Header da Tabela */}
                      <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-gray-100 text-gray-600 font-medium text-xs uppercase tracking-wide">
                        <div className="col-span-1">ID Pedido</div>
                        <div className="col-span-1">Data</div>
                        <div className="col-span-2">Cliente</div>
                        <div className="col-span-2 text-right">Valor</div>
                        <div className="col-span-1 text-center">Margem</div>
                        <div className="col-span-2 text-center">Motivo</div>
                        <div className="col-span-1 text-center">Status</div>
                        <div className="col-span-2 text-right">Ação</div>
                      </div>

                      {/* Linhas de Pedidos */}
                      {filteredOrders.map((order) => (
                        <div
                          key={order.id}
                          className="grid grid-cols-12 gap-4 px-4 py-4 border-t border-gray-100 hover:bg-gray-50 items-center"
                        >
                          {/* ID do Pedido */}
                          <div className="col-span-1">
                            <span className="text-gray-600 font-medium">
                              #{order.orderNumber}
                            </span>
                          </div>

                          {/* Data */}
                          <div className="col-span-1">
                            <span className="text-gray-700">
                              {formatDate(order.createdAt)}
                            </span>
                          </div>

                          {/* Cliente */}
                          <div className="col-span-2 flex items-center gap-2">
                            <div
                              className={`min-w-8 h-8 rounded-md ${getClientAvatarColor(
                                order.clientName,
                              )} flex items-center justify-center text-white text-xs font-semibold`}
                            >
                              {getClientInitials(order.clientName)}
                            </div>
                            <span className="text-gray-900 font-medium">
                              {order.clientName}
                            </span>
                          </div>

                          {/* Valor */}
                          <div className="col-span-2 text-right">
                            <span className="text-gray-900 font-medium">
                              {formatCurrency(order.totalValue)}
                            </span>
                          </div>

                          {/* Margem */}
                          <div className="col-span-1 text-center">
                            <span className="text-gray-900 font-medium">
                              {formatMargin(order.averageMargin)}
                            </span>
                          </div>

                          {/* Motivo */}
                          <div className="col-span-2 flex justify-center">
                            {getReasonBadge(
                              order.lossReasonDetail?.code || null,
                            )}
                          </div>

                          {/* Status de Justificativa */}
                          <div className="col-span-1 flex justify-center">
                            {getJustificationStatus(order)}
                          </div>

                          {/* Ação */}
                          <div className="col-span-2 flex justify-end">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOrderClick(order);
                              }}
                              className="text-blue-500 hover:text-blue-700 font-medium text-sm flex items-center gap-1"
                            >
                              Ver Detalhes <ChevronRight size={16} />
                            </button>
                          </div>
                        </div>
                      ))}

                      {filteredOrders.length === 0 && (
                        <div className="px-4 py-8 text-center text-gray-500">
                          Nenhum pedido encontrado com os filtros selecionados.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal de Detalhes */}
      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}
    </>
  );
};
