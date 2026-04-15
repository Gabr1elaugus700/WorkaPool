import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Clock, XCircle, List } from "lucide-react";

interface OrderFilterProps {
  activeFilter: 'all' | 'NEGOTIATING' | 'LOST';
  onFilterChange: (filter: 'all' | 'NEGOTIATING' | 'LOST') => void;
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
        variant={activeFilter === 'NEGOTIATING' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onFilterChange('NEGOTIATING')}
        className={cn(
          "flex items-center gap-2",
          activeFilter === 'NEGOTIATING' && "bg-yellow-600 hover:bg-yellow-700"
        )}
      >
        <Clock className="h-4 w-4" />
        Em Negociação
        <span className={cn(
          "ml-1 px-2 py-0.5 rounded-full text-xs font-semibold",
          activeFilter === 'NEGOTIATING' 
            ? "bg-white/20 text-white" 
            : "bg-gray-100 text-gray-700"
        )}>
          {counts.negotiating}
        </span>
      </Button>

      <Button
        variant={activeFilter === 'LOST' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onFilterChange('LOST')}
        className={cn(
          "flex items-center gap-2",
          activeFilter === 'LOST' && "bg-red-600 hover:bg-red-700"
        )}
      >
        <XCircle className="h-4 w-4" />
        Perdidos
        <span className={cn(
          "ml-1 px-2 py-0.5 rounded-full text-xs font-semibold",
          activeFilter === 'LOST' 
            ? "bg-white/20 text-white" 
            : "bg-gray-100 text-gray-700"
        )}>
          {counts.lost}
        </span>
      </Button>
    </div>
  );
};
