import { OrderStatus } from "../types/orderLoss.types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Clock, XCircle, List } from "lucide-react";

interface OrderFilterProps {
  activeFilter: OrderStatus | 'all';
  onFilterChange: (filter: OrderStatus | 'all') => void;
  counts: {
    all: number;
    negotiating: number;
    lost: number;
  };
}

export const OrderFilter: React.FC<OrderFilterProps> = ({
  activeFilter,
  onFilterChange,
  counts,
}) => {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant={activeFilter === 'all' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onFilterChange('all')}
        className={cn(
          "flex items-center gap-2",
          activeFilter === 'all' && "bg-blue-600 hover:bg-blue-700"
        )}
      >
        <List className="h-4 w-4" />
        Todos
        <span className={cn(
          "ml-1 px-2 py-0.5 rounded-full text-xs font-semibold",
          activeFilter === 'all' 
            ? "bg-white/20 text-white" 
            : "bg-gray-100 text-gray-700"
        )}>
          {counts.all}
        </span>
      </Button>

      <Button
        variant={activeFilter === 'negotiating' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onFilterChange('negotiating')}
        className={cn(
          "flex items-center gap-2",
          activeFilter === 'negotiating' && "bg-yellow-600 hover:bg-yellow-700"
        )}
      >
        <Clock className="h-4 w-4" />
        Em Negociação
        <span className={cn(
          "ml-1 px-2 py-0.5 rounded-full text-xs font-semibold",
          activeFilter === 'negotiating' 
            ? "bg-white/20 text-white" 
            : "bg-gray-100 text-gray-700"
        )}>
          {counts.negotiating}
        </span>
      </Button>

      <Button
        variant={activeFilter === 'lost' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onFilterChange('lost')}
        className={cn(
          "flex items-center gap-2",
          activeFilter === 'lost' && "bg-red-600 hover:bg-red-700"
        )}
      >
        <XCircle className="h-4 w-4" />
        Perdidos
        <span className={cn(
          "ml-1 px-2 py-0.5 rounded-full text-xs font-semibold",
          activeFilter === 'lost' 
            ? "bg-white/20 text-white" 
            : "bg-gray-100 text-gray-700"
        )}>
          {counts.lost}
        </span>
      </Button>
    </div>
  );
};
