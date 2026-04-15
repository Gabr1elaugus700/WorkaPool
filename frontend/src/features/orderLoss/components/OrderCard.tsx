import { LegacyOrder, lossReasonLabels } from "../types/orderLoss.types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle } from "lucide-react";

interface OrderCardProps {
  order: LegacyOrder;
  onClick: () => void;
}

export const OrderCard: React.FC<OrderCardProps> = ({ order, onClick }) => {
  const isLost = order.status === 'lost';
  const hasLossReason = !!order.lossReasonDetail;
  const borderColor = isLost ? 'border-l-red-500' : 'border-l-yellow-500';
  
  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    });
  };

  const formatWeight = (weight: number) => {
    return `${weight.toLocaleString('pt-BR', { minimumFractionDigits: 0 })} kg`;
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-white rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer p-3 border-l-4",
        borderColor,
        "hover:translate-y-[-2px]",
        hasLossReason && "opacity-75"
      )}
    >
      <div className="space-y-2">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="font-semibold text-sm text-gray-900 line-clamp-1">
              {order.clientName}
            </h4>
            <p className="text-xs text-gray-500">
              #{order.orderNumber}
            </p>
          </div>
          <div className="flex flex-col gap-1 items-end">
            <div className={cn(
              "px-2 py-1 rounded text-xs font-medium",
              isLost 
                ? "bg-red-100 text-red-700" 
                : "bg-yellow-100 text-yellow-700"
            )}>
              {isLost ? 'Perdido' : 'Negociação'}
            </div>
            {hasLossReason && (
              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-300">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Justificado
              </Badge>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-500">Valor:</span>
            <span className="font-medium text-gray-900">
              {formatCurrency(order.totalValue)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Peso:</span>
            <span className="font-medium text-gray-900">
              {formatWeight(order.totalWeight)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Margem:</span>
            <span className="font-medium text-green-600">
              {order.averageMargin.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Justificativa (se houver) */}
        {hasLossReason && order.lossReasonDetail && (
          <div className="pt-2 border-t border-green-200 bg-green-50 -mx-3 -mb-3 px-3 pb-3 mt-2 rounded-b-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-3.5 w-3.5 text-green-700 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-green-900 mb-1">
                  {lossReasonLabels[order.lossReasonDetail.code]}
                </p>
                <p className="text-xs text-green-800 line-clamp-2">
                  {order.lossReasonDetail.description}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer - movido para fora do espaço de justificativa */}
        {!hasLossReason && (
          <div className="pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              {new Date(order.updatedAt).toLocaleDateString('pt-BR')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
