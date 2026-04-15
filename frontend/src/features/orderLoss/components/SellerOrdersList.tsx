import { useState } from "react";
import { LegacyOrder, LossReasonCode, lossReasonLabels } from "../types/orderLoss.types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LossReasonForm } from "./LossReasonForm";
import { OrderDetailsModal } from "./OrderDetailsModal";
import { 
  Calendar, 
  DollarSign, 
  Package, 
  TrendingUp, 
  AlertCircle,
  CheckCircle2,
  Clock
} from "lucide-react";

interface SellerOrdersListProps {
  orders: LegacyOrder[];
  onUpdateLossReason: (orderNumber: string, code: LossReasonCode, description: string) => void;
  isSubmitting?: boolean;
}

export const SellerOrdersList: React.FC<SellerOrdersListProps> = ({
  orders,
  onUpdateLossReason,
  isSubmitting = false,
}) => {
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<LegacyOrder | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const formatWeight = (weight: number) => {
    return `${weight.toLocaleString('pt-BR', { minimumFractionDigits: 0 })} kg`;
  };

  const handleLossReasonSubmit = (orderNumber: string, code: LossReasonCode, description: string) => {
    // console.log('📋 [SellerOrdersList] handleLossReasonSubmit chamado');
    // console.log('📋 [SellerOrdersList] orderNumber:', orderNumber);
    // console.log('📋 [SellerOrdersList] code:', code);
    // console.log('📋 [SellerOrdersList] description:', description);
    
    onUpdateLossReason(orderNumber, code, description);
    setExpandedOrderId(null);
  };

  const handleViewDetails = (order: LegacyOrder) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedOrder(null), 200);
  };

  // Ordenar por data de criação (mais recente primeiro)
  const sortedOrders = [...orders].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <>
      <div className="space-y-4">
        {sortedOrders.map((order) => {
          const isLost = order.status === 'lost';
          const hasLossReason = !!order.lossReasonDetail;
          const isExpanded = expandedOrderId === order.id;
          const needsLossReason = isLost && !hasLossReason;

          return (
            <Card
              key={order.id}
              className={cn(
                "overflow-hidden transition-all",
                needsLossReason && "border-2"
              )}
            >
              <CardContent className="p-0">
                {/* Header do Card */}
                <div className="p-4 bg-gradient-to-r from-gray-50 to-white">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg text-gray-900">
                          {order.clientName}
                        </h3>
                        <Badge
                          variant={isLost ? "destructive" : "default"}
                          className={cn(
                            "text-xs",
                            !isLost && "bg-yellow-500 hover:bg-yellow-600"
                          )}
                        >
                          {isLost ? (
                            <>
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Perdido
                            </>
                          ) : (
                            <>
                              <Clock className="h-3 w-3 mr-1" />
                              Em Negociação
                            </>
                          )}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500">
                        Pedido #{order.orderNumber}
                      </p>
                    </div>
                  </div>

                  {/* Info Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-blue-600" />
                      <div>
                        <p className="text-xs text-gray-500">Valor</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {formatCurrency(order.totalValue)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-purple-600" />
                      <div>
                        <p className="text-xs text-gray-500">Peso</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {formatWeight(order.totalWeight)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <div>
                        <p className="text-xs text-gray-500">Margem</p>
                        <p className="text-sm font-semibold text-green-600">
                          {order.averageMargin.toFixed(1)}%
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-orange-600" />
                      <div>
                        <p className="text-xs text-gray-500">Emissão</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Loss Reason Badge (se já tiver) */}
                  {hasLossReason && order.lossReasonDetail && (
                    <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-semibold text-red-900">
                              Motivo:
                            </span>
                            <Badge variant="destructive" className="text-xs">
                              {lossReasonLabels[order.lossReasonDetail.code]}
                            </Badge>
                          </div>
                          <p className="text-sm text-red-800">
                            {order.lossReasonDetail.description}
                          </p>
                          <p className="text-xs text-red-600 mt-1">
                            Informado em: {new Date(order.lossReasonDetail.submittedAt).toLocaleString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Alerta de necessidade de justificativa */}
                  {needsLossReason && !isExpanded && (
                    <div className="mb-3 p-3 bg-yellow-50 border border-yellow-300 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-yellow-600" />
                          <span className="text-sm font-medium text-yellow-900">
                            Justificativa de perda necessária
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Botões */}
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewDetails(order)}
                      className="flex-1 text-xs font-medium h-8 text-muted-foreground hover:text-foreground"
                    >
                      Ver Detalhes
                    </Button>
                    
                    {needsLossReason && (
                      <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                      disabled={isSubmitting}
                      className={cn(
                        "flex-1 text-xs font-medium h-8",
                        isExpanded 
                        ? "border-gray-600/30 text-gray-700 hover:bg-gray-600/10 hover:text-gray-700" 
                        : "border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      )}
                      >
                      {isExpanded ? "Cancelar" : "Informar Motivo"}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Formulário de Motivo (expandido) */}
                {isExpanded && needsLossReason && (
                  <div className="p-4 border-t bg-gray-50">
                    <LossReasonForm
                      onSubmit={(code, description) =>
                        handleLossReasonSubmit(order.orderNumber, code, description)
                      }
                      onCancel={() => setExpandedOrderId(null)}
                      isSubmitting={isSubmitting}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}

        {orders.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <CheckCircle2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                Nenhum pedido encontrado
              </h3>
              <p className="text-sm text-gray-500">
                Você ainda não possui pedidos registrados.
              </p>
            </CardContent>
          </Card>
        )}
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
