import { useState } from "react";
import { Seller, Order } from "../types/orderLoss.types";
import { OrderCard } from "./OrderCard";
import { OrderDetailsModal } from "./OrderDetailsModal";
import { ScrollArea } from "@/components/ui/scroll-area";

interface KanbanBoardProps {
  sellers: Seller[];
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ sellers }) => {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOrderClick = (order: Order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedOrder(null), 200);
  };

  return (
    <>
      <div className="w-full overflow-x-auto">
        <div className="inline-flex gap-4 min-w-full pb-4">
          {sellers.map((seller) => (
            <div
              key={seller.id}
              className="flex-shrink-0 w-80 bg-gray-300 rounded-lg p-4"
            >
              {/* Header da Coluna */}
              <div className="mb-4">
                <h3 className="font-semibold text-lg text-gray-900">
                  {seller.name}
                </h3>
                <p className="text-sm text-gray-500">
                  {seller.orders.length} {seller.orders.length === 1 ? 'pedido' : 'pedidos'}
                </p>
              </div>

              {/* Lista de Pedidos */}
              <ScrollArea className="h-[calc(100vh-350px)]">
                <div className="space-y-3 pr-2">
                  {seller.orders.length > 0 ? (
                    seller.orders.map((order) => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        onClick={() => handleOrderClick(order)}
                      />
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-400 text-sm">
                      Nenhum pedido
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          ))}
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
