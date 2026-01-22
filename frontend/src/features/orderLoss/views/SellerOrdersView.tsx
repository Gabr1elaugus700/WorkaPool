import { useState, useMemo } from "react";
import DefaultLayout from "@/layout/DefaultLayout";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SellerOrdersList } from "../components/SellerOrdersList";
import { OrderFilter } from "../components/OrderFilter";
import { 
  mockSellerOrders, 
  mockLoggedSeller, 
  calculateSellerStats 
} from "../services/sellerMockData";
import { Order, LossReasonCode, OrderStatus } from "../types/orderLoss.types";
import { 
  ShoppingCart, 
//   TrendingUp, 
  AlertCircle, 
//   DollarSign,
  Clock,
  XCircle
} from "lucide-react";

export const SellerOrdersView = () => {
  // Estado local dos pedidos (para simular atualizações)
  const [orders, setOrders] = useState<Order[]>(mockSellerOrders);
  const [activeFilter, setActiveFilter] = useState<OrderStatus | 'all'>('all');

  // Calcular estatísticas
  const stats = useMemo(() => calculateSellerStats(orders), [orders]);

  // Filtrar pedidos baseado no filtro ativo
  const filteredOrders = useMemo(() => {
    if (activeFilter === 'all') return orders;
    return orders.filter(order => order.status === activeFilter);
  }, [orders, activeFilter]);

  // Contadores para os filtros
  const filterCounts = useMemo(() => ({
    all: orders.length,
    negotiating: orders.filter(o => o.status === 'negotiating').length,
    lost: orders.filter(o => o.status === 'lost').length,
  }), [orders]);

  // Função para atualizar motivo de perda
  const handleUpdateLossReason = (
    orderId: string,
    code: LossReasonCode,
    description: string
  ) => {
    setOrders(prevOrders =>
      prevOrders.map(order =>
        order.id === orderId
          ? {
              ...order,
              lossReasonDetail: {
                code,
                description,
                submittedAt: new Date(),
              },
            }
          : order
      )
    );
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  return (
    <DefaultLayout>
      <div className="w-full mx-auto px-2 sm:px-4 bg-white/50">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-content-light dark:text-content-dark text-center">
            Meus Pedidos
          </h1>
          <p className="text-center text-gray-600 mt-2">
            Olá, <span className="font-semibold">{mockLoggedSeller.name}</span> - Gerencie suas negociações
          </p>
        </div>

        <Separator className="my-4 bg-[#17cf54]" />

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {/* Total de Pedidos */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                Total de Pedidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {stats.totalOrders}
              </div>
              <div className="flex gap-2 mt-2 text-xs">
                <span className="text-gray-500">
                  Valor total: {formatCurrency(stats.totalValue)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Em Negociação */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Em Negociação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">
                {stats.negotiatingOrders}
              </div>
              <div className="flex gap-2 mt-2 text-xs">
                <span className="text-gray-500">
                  Valor: {formatCurrency(stats.negotiatingValue)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Pedidos Perdidos */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                Pedidos Perdidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="text-3xl font-bold text-red-600">
                  {stats.lostOrders}
                </div>
                {stats.lostWithoutReason > 0 && (
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {stats.lostWithoutReason} pendente{stats.lostWithoutReason > 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
              <div className="flex gap-2 mt-2 text-xs">
                <span className="text-gray-500">
                  {stats.lostWithoutReason > 0 
                    ? `${stats.lostWithoutReason} sem justificativa`
                    : 'Todos justificados'
                  }
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alerta de Pedidos Pendentes */}
        {stats.lostWithoutReason > 0 && (
          <Card className="mb-6 border-yellow-300 bg-yellow-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-semibold text-yellow-900 mb-1">
                    Atenção: Justificativas Pendentes
                  </h3>
                  <p className="text-sm text-yellow-800">
                    Você possui <strong>{stats.lostWithoutReason}</strong> pedido
                    {stats.lostWithoutReason > 1 ? 's' : ''} perdido
                    {stats.lostWithoutReason > 1 ? 's' : ''} sem justificativa. 
                    Por favor, informe o motivo da perda para cada um deles.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lista de Pedidos */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <h2 className="text-xl font-semibold text-gray-800">
              Histórico de Pedidos
            </h2>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <OrderFilter
                activeFilter={activeFilter}
                onFilterChange={setActiveFilter}
                counts={filterCounts}
              />
              <div className="text-sm text-gray-500 whitespace-nowrap">
                Ordenado por data
              </div>
            </div>
          </div>

          <SellerOrdersList
            orders={filteredOrders}
            onUpdateLossReason={handleUpdateLossReason}
          />
        </div>
      </div>
    </DefaultLayout>
  );
};

export default SellerOrdersView;
