import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Order } from "../types/orderLoss.types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Package, TrendingUp, Truck, DollarSign } from "lucide-react";

interface OrderDetailsModalProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
}

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  order,
  isOpen,
  onClose,
}) => {
  const isLost = order.status === 'lost';

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const formatWeight = (weight: number) => {
    return `${weight.toLocaleString('pt-BR', { minimumFractionDigits: 0 })} kg`;
  };

  const calculateTotalFreight = () => {
    return order.products.reduce((sum, product) => sum + product.freight, 0);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl">
                Pedido #{order.orderNumber}
              </DialogTitle>
              <DialogDescription className="mt-1">
                Cliente: {order.clientName} • Vendedor: {order.seller}
              </DialogDescription>
            </div>
            <Badge 
              variant={isLost ? "destructive" : "default"}
              className={isLost ? "" : "bg-yellow-500 hover:bg-yellow-600"}
            >
              {isLost ? 'Perdido' : 'Em Negociação'}
            </Badge>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-200px)] pr-4">
          <div className="space-y-6">
            {/* Resumo Geral */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                <DollarSign className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-600">Valor Total</p>
                  <p className="font-semibold text-blue-900">
                    {formatCurrency(order.totalValue)}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-600">Margem Média</p>
                  <p className="font-semibold text-green-900">
                    {order.averageMargin.toFixed(1)}%
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                <Package className="h-5 w-5 text-purple-600 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-600">Peso Total</p>
                  <p className="font-semibold text-purple-900">
                    {formatWeight(order.totalWeight)}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
                <Truck className="h-5 w-5 text-orange-600 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-600">Frete Total</p>
                  <p className="font-semibold text-orange-900">
                    {formatCurrency(calculateTotalFreight())}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Justificativa de Perda */}
            {isLost && order.lossReason && (
              <>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-red-900 mb-2">
                        Motivo da Perda
                      </h4>
                      <p className="text-sm text-red-800">
                        {order.lossReason}
                      </p>
                    </div>
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Lista de Produtos */}
            <div>
              <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Package className="h-5 w-5" />
                Produtos ({order.products.length})
              </h4>
              
              <div className="space-y-3">
                {order.products.map((product) => (
                  <div
                    key={product.id}
                    className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h5 className="font-medium text-gray-900">
                          {product.name}
                        </h5>
                        <p className="text-sm text-gray-500 mt-1">
                          ID: {product.id}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-lg">
                          {formatCurrency(product.totalPrice)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatCurrency(product.unitPrice)}/un
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                      <div>
                        <p className="text-gray-500 text-xs mb-1">Quantidade</p>
                        <p className="font-medium">{product.quantity} un</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs mb-1">Peso</p>
                        <p className="font-medium">{formatWeight(product.weight)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs mb-1">Margem</p>
                        <p className="font-medium text-green-600">
                          {product.margin.toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs mb-1">Frete</p>
                        <p className="font-medium">{formatCurrency(product.freight)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs mb-1">Volume</p>
                        <p className="font-medium">
                          {(product.weight * product.quantity).toLocaleString('pt-BR', { 
                            minimumFractionDigits: 0 
                          })} kg
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Datas */}
            <Separator />
            <div className="flex justify-between text-sm text-gray-500">
              <div>
                <span className="font-medium">Criado em:</span>{' '}
                {new Date(order.createdAt).toLocaleString('pt-BR')}
              </div>
              <div>
                <span className="font-medium">Atualizado em:</span>{' '}
                {new Date(order.updatedAt).toLocaleString('pt-BR')}
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
