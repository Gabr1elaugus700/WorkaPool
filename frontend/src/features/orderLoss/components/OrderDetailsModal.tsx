import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LegacyOrder } from "../types/orderLoss.types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Package, Truck, MessageSquareMore } from "lucide-react";
import formatMargin from "@/utils/formatMargin";
import formatWeight from "@/utils/formatWeight";
import getInitials from "@/utils/getInitials";

interface OrderDetailsModalProps {
  order: LegacyOrder;
  isOpen: boolean;
  onClose: () => void;
}

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  order,
  isOpen,
  onClose,
}) => {
  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const calculateTotalFreight = () => {
    return order.products.reduce((sum, product) => sum + product.freight, 0);
  };

  const calculateTotalVolume = () => {
    return order.products.reduce((sum, product) => sum + (product.weight * product.quantity), 0);
  };

  


  const getReasonLabel = (code: string) => {
    const labels: Record<string, string> = {
      'FREIGHT': 'FRETE ALTO',
      'PRICE': 'PREÇO',
      'MARGIN': 'MARGEM INSUFICIENTE',
      'STOCK': 'ESTOQUE INSUFICIENTE',
      'OTHER': 'OUTROS',
    };
    return labels[code] || code;
  };

  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-normal">
            Detalhes e Justificativa do Pedido{" "}
            <span className="text-gray-500">#{order.orderNumber}</span>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)] pr-4">
          <div className="space-y-6">
            {/* Informações Principais */}
            <div className="grid grid-cols-3 gap-6 bg-gray-50 rounded-lg p-6">
              <div>
                <p className="text-xs text-gray-500 uppercase font-medium mb-2">
                  Cliente
                </p>
                <p className="font-semibold text-gray-900">
                  {order.clientName}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-medium mb-2">
                  Valor Total
                </p>
                <p className="font-semibold text-gray-900 text-lg">
                  {formatCurrency(order.totalValue)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-medium mb-2">
                  Motivo da Perda
                </p>
                {order.lossReasonDetail?.code ? (
                  <span className="inline-block px-3 py-1 rounded-full bg-red-50 text-red-600 text-sm font-medium">
                    {getReasonLabel(order.lossReasonDetail.code)}
                  </span>
                ) : (
                  <span className="text-gray-400 text-sm">Não informado</span>
                )}
              </div>
            </div>

            {/* Produtos do Pedido */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Package className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold text-gray-900 uppercase text-sm">
                  Produtos do Pedido
                </h3>
              </div>

              <div className="border rounded-lg overflow-hidden">
                {/* Header da Tabela */}
                <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-gray-50 border-b">
                  <div className="col-span-4 text-xs text-gray-500 uppercase font-medium">
                    Produto
                  </div>
                  <div className="col-span-2 text-center text-xs text-gray-500 uppercase font-medium">
                    QTD
                  </div>
                  <div className="col-span-2 text-center text-xs text-gray-500 uppercase font-medium">
                    MARGEM
                  </div>
                  <div className="col-span-2 text-right text-xs text-gray-500 uppercase font-medium">
                    Unitário
                  </div>
                  <div className="col-span-2 text-right text-xs text-gray-500 uppercase font-medium">
                    Total
                  </div>
                </div>

                {/* Linhas de Produtos */}
                {order.products.map((product, index) => (
                  <div
                    key={product.id}
                    className={`grid grid-cols-12 gap-4 px-4 py-4 ${
                      index !== order.products.length - 1 ? "border-b" : ""
                    }`}
                  >
                    <div className="col-span-4">
                      <p className="font-medium text-gray-900">{product.name}</p>
                    </div>
                    <div className="col-span-2 text-center">
                      <p className="text-gray-700">{formatWeight(product.quantity)}</p>
                    </div>
                    <div className="col-span-2 text-center">
                      <p className="text-gray-700">{formatMargin(product.margin)}</p>
                    </div>
                    <div className="col-span-2 text-right">
                      <p className="text-gray-700">{formatCurrency(product.unitPrice)}</p>
                    </div>
                    <div className="col-span-2 text-right">
                      <p className="font-semibold text-gray-900">
                        {formatCurrency(product.totalPrice)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Logística e Frete */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Truck className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold text-gray-900 uppercase text-sm">
                  Logística e Frete
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Custo do Frete</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {formatCurrency(calculateTotalFreight())}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Volume Total</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {formatWeight(calculateTotalVolume())}
                  </p>
                </div>
              </div>
            </div>

            {/* Justificativa do Vendedor */}
            {order.lossReasonDetail && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <MessageSquareMore className="h-5 w-5 text-green-600" />
                  <h3 className="font-semibold text-gray-900 uppercase text-sm">
                    Justificativa do Vendedor
                  </h3>
                </div>

                <div className="border-l-4 border-green-600 bg-gray-50 rounded-r-lg p-5">
                  <p className="text-gray-700 leading-relaxed mb-4">
                    {order.lossReasonDetail.description}
                  </p>

                  <Separator className="my-4" />

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white font-semibold">
                      {getInitials(order.seller)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {order.seller}
                      </p>
                      <p className="text-sm text-gray-500">
                        {order.lossReasonDetail.submittedBy}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
