import { Order } from "../types/orderLoss.types";
import { cn } from "@/lib/utils";

interface OrderCardProps {
  order: Order;
  onClick: () => void;
}

export const OrderCard: React.FC<OrderCardProps> = ({ order, onClick }) => {
  const isLost = order.status === 'lost';
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
        "hover:translate-y-[-2px]"
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
          <div className={cn(
            "px-2 py-1 rounded text-xs font-medium",
            isLost 
              ? "bg-red-100 text-red-700" 
              : "bg-yellow-100 text-yellow-700"
          )}>
            {isLost ? 'Perdido' : 'Negociação'}
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

        {/* Footer */}
        <div className="pt-2 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            {new Date(order.updatedAt).toLocaleDateString('pt-BR')}
          </p>
        </div>
      </div>
    </div>
  );
};
