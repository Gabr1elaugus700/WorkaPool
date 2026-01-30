import { useState, useMemo } from "react";

import DefaultLayout from "@/layout/DefaultLayout";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { SellerOrdersList } from "../components/SellerOrdersList";
import { OrderFilter } from "../components/OrderFilter";
import { useLostOrdersFromSapiens } from "../hooks/useOrders";
import { useAuth } from "@/auth/AuthContext";
import { LostOrderFromSapiens, LossReasonCode, OrderStatus } from "../types/orderLoss.types";
import { 
  AlertCircle, 
  FileText,
  XCircle,
  Loader2,
  MessageSquare
} from "lucide-react";
import { StatCard } from "../components/StatCard";

// Helper para agrupar pedidos do SAPIENS por número de ped ido
const groupOrdersByNumber = (orders: LostOrderFromSapiens[]) => {
  const grouped = new Map<string, LostOrderFromSapiens[]>();
  
  orders.forEach(order => {
    const key = order.NUMPED;
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(order);
  });
  
  return Array.from(grouped.entries()).map(([numped, items]) => ({
    numped,
    items,
    firstItem: items[0],
    totalValue: items.reduce((sum, item) => sum + item.VLRFINAL, 0),
  }));
};

export const SellerOrdersView = () => {
  const { user} = useAuth();
  const [activeFilter, setActiveFilter] = useState<OrderStatus | 'all'>('all');

  // console.log('🚀 SellerOrdersView montado - user:', user);
  // console.log('📍 codRep do usuário:', user?.codRep);

  // Buscar pedidos do SAPIENS filtrados por codRep do usuário logado
  const { data: sapiensOrders, isLoading, error } = useLostOrdersFromSapiens({
    codRep: user?.codRep?.toString(),
  });

  console.log('📊 Estado da query:', { sapiensOrders, isLoading, error });

  // Agrupar pedidos por número
  const groupedOrders = useMemo(() => {
    if (!sapiensOrders) return [];
    return groupOrdersByNumber(sapiensOrders);
  }, [sapiensOrders]);

  // Calcular estatísticas
  const stats = useMemo(() => {
    if (!groupedOrders) return {
      totalOrders: 0,
      negotiatingOrders: 0,
      lostOrders: 0,
      totalValue: 0,
      negotiatingValue: 0,
      lostWithoutReason: 0,
    };

    const lostOrders = groupedOrders.filter(g => g.firstItem.SITUAÇÃO === '5');
    
    return {
      totalOrders: groupedOrders.length,
      negotiatingOrders: 0, // SAPIENS só tem perdidos
      lostOrders: lostOrders.length,
      totalValue: groupedOrders.reduce((sum, g) => sum + g.totalValue, 0),
      negotiatingValue: 0,
      lostWithoutReason: lostOrders.length, // Todos sem justificativa inicial
    };
  }, [groupedOrders]);

  // Filtrar pedidos (atualmente todos são perdidos do SAPIENS)
  const filteredOrders = useMemo(() => {
    if (activeFilter === 'all' || activeFilter === 'LOST') return groupedOrders;
    return []; // Não há pedidos em negociação no SAPIENS
  }, [groupedOrders, activeFilter]);

  // Contadores para os filtros
  const filterCounts = useMemo(() => ({
    all: groupedOrders.length,
    negotiating: 0,
    lost: groupedOrders.length,
  }), [groupedOrders]);

  // Função para atualizar motivo de perda
  const handleUpdateLossReason = (
    orderId: string,
    code: LossReasonCode,
    description: string
  ) => {
    // TODO: Implementar adição de motivo de perda via API
    console.log("Adicionar motivo de perda:", { orderId, code, description });
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  if (isLoading) {
    return (
      <DefaultLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary mb-4" />
            <p className="text-gray-600">Carregando pedidos...</p>
          </div>
        </div>
      </DefaultLayout>
    );
  }

  if (error) {
    return (
      <DefaultLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
            <p className="text-red-600 font-semibold mb-2">Erro ao carregar pedidos</p>
            <p className="text-gray-600 text-sm">
              {error instanceof Error ? error.message : "Erro desconhecido"}
            </p>
          </div>
        </div>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout>
      <div className="w-full mx-auto px-2 sm:px-4 bg-background/50">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-content-light dark:text-content-dark text-center">
            Meus Pedidos
          </h1>
          <p className="text-center text-gray-600 mt-2">
            Olá, <span className="font-semibold">{user?.name || "Vendedor"}</span> - Gerencie suas negociações
          </p>
        </div>

        <Separator className="my-4 bg-[#17cf54]" />

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          <StatCard
            icon={FileText}
            iconBgColor="blue"
            title="Total de Pedidos"
            value={stats.totalOrders}
            subtitle={`Valor total: ${formatCurrency(stats.totalValue)}`}
          />
          <StatCard
            icon={MessageSquare}
            iconBgColor="yellow"
            title="Em Negociação"
            value={stats.negotiatingOrders}
            subtitle={`Valor: ${formatCurrency(stats.negotiatingValue)}`}
          />
          <StatCard
            icon={XCircle}
            iconBgColor="red"
            title="Pedidos Perdidos"
            value={stats.lostOrders}
            subtitle={
              stats.lostWithoutReason > 0
                ? `${stats.lostWithoutReason} aguardando justificativa`
                : "Todos justificados"
            }
          />
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
            orders={filteredOrders.map(g => ({
              id: g.numped,
              orderNumber: g.numped,
              status: 'lost',
              clientName: g.firstItem.FANTASIA,
              totalValue: g.totalValue,
              totalWeight: g.items.reduce((sum, item) => sum + (item.QTDPED * 1), 0),
              averageMargin: g.items.reduce((sum, item) => sum + item["MARGEM LUCRO"], 0) / g.items.length,
              createdAt: new Date(g.firstItem.DATA),
              updatedAt: new Date(g.firstItem.DATA),
              seller: g.firstItem.APEREP,
              sellerId: g.firstItem.CODREP.toString(),
              products: g.items.map((item, idx) => ({
                id: `${g.numped}-${idx}`,
                name: item.PRODUTO,
                quantity: item.QTDPED,
                weight: 1,
                margin: item["MARGEM LUCRO"],
                freight: item.VLRFRETE,
                unitPrice: item.PREUNI,
                totalPrice: item.VLRFINAL,
              })),
            }))}
            onUpdateLossReason={handleUpdateLossReason}
          />
        </div>
      </div>
    </DefaultLayout>
  );
};

export default SellerOrdersView;
