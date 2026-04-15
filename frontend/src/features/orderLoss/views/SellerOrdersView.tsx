import { useState, useMemo } from "react";
import { toast } from "sonner";
import DefaultLayout from "@/layout/DefaultLayout";
import { SellerOrdersList } from "../components/SellerOrdersList";
import { OrderFilter } from "../components/OrderFilter";
import { OrderLossAsyncLayout } from "../components/OrderLossAsyncLayout";
import { useLostOrdersFromSapiens, useOrders } from "../hooks/useOrders";
import { useAuth } from "@/auth/AuthContext";
import { LossReasonCode } from "../types/orderLoss.types";
import { OrderService } from "../services/ordersServices";
import { FileText, XCircle, MessageSquare } from "lucide-react";
import { StatCard } from "../components/StatCard";
import { groupLostOrdersByNumber } from "../utils/groupLostOrdersByNumber";
import { normalizeOrderNumberKey } from "../utils/orderNumberKey";

function toQueryError(err: unknown): Error | null {
  if (!err) return null;
  if (err instanceof Error) return err;
  return new Error(String(err));
}

function normalizeCodRep(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  return String(value).replace(/\D/g, "");
}

export const SellerOrdersView = () => {
  const { user } = useAuth();
  console.log('📍 Usuário:', user);
  const [activeFilter, setActiveFilter] = useState<'all' | 'NEGOTIATING' | 'LOST'>('all');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // console.log('🚀 SellerOrdersView montado - user:', user);
  console.log('📍 codRep do usuário:', user?.codRep);

  // Buscar pedidos do SAPIENS filtrados por codRep do usuário logado
  const { data: sapiensOrders, isLoading, error, refetch: refetchSapiens } = useLostOrdersFromSapiens({
    codRep: user?.codRep?.toString(),
  });

  // Buscar pedidos locais já justificados
  const { data: localOrders, refetch: refetchLocal } = useOrders();

  console.log('📊 Estado da query:', { sapiensOrders, isLoading, error });

  // Filtrar pedidos do SAPIENS removendo os já justificados
  const unjustifiedSapiensOrders = useMemo(() => {
    if (!sapiensOrders || !localOrders) return sapiensOrders || [];

    const currentUserCodRep = normalizeCodRep(user?.codRep);

    // Pegar números de pedidos que já foram justificados
    const justifiedOrderNumbers = new Set(
      localOrders
        .filter(
          (order) =>
            !!order.lossReason &&
            normalizeCodRep(order.order.codRep) === currentUserCodRep,
        )
        .map((order) => normalizeOrderNumberKey(order.order.orderNumber))
        .filter((key) => key !== ""),
    );

    // Filtrar pedidos do SAPIENS que NÃO estão justificados
    return sapiensOrders.filter(
      (order) => !justifiedOrderNumbers.has(normalizeOrderNumberKey(order.NUMPED)),
    );
  }, [sapiensOrders, localOrders, user?.codRep]);

  // Agrupar pedidos por número (apenas os não justificados)
  const groupedOrders = useMemo(() => {
    if (!unjustifiedSapiensOrders) return [];
    return groupLostOrdersByNumber(unjustifiedSapiensOrders);
  }, [unjustifiedSapiensOrders]);

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
  const handleUpdateLossReason = async (
    orderNumber: string,
    code: LossReasonCode,
    description: string
  ) => {
    // console.log('🎯 [SellerOrdersView] handleUpdateLossReason iniciado');
    // console.log('🎯 [SellerOrdersView] Parâmetros:', { orderNumber, code, description });
    // console.log('🎯 [SellerOrdersView] user:', user);
    // console.log('🎯 [SellerOrdersView] user.codRep:', user?.codRep);
    
    if (!user?.codRep) {
      console.error('❌ [SellerOrdersView] Usuário não identificado');
      toast.error("Erro: Usuário não identificado");
      return;
    }

    setIsSubmitting(true);
    
    try {
      // console.log('🚀 [SellerOrdersView] Chamando OrderService.createOrderWithLossReason...');
      
      // Criar pedido localmente e adicionar motivo de perda
      const result = await OrderService.createOrderWithLossReason(
        orderNumber,
        String(user.codRep),
        user.id,
        code,
        description
      );

      console.log('✅ [SellerOrdersView] Sucesso! Resultado:', result);
      toast.success("Justificativa registrada com sucesso!");
      
      // Recarregar dados
      refetchSapiens();
      refetchLocal();
    } catch (err) {
      // console.error('❌ [SellerOrdersView] Erro completo:', err);
      // console.error('❌ [SellerOrdersView] Erro message:', err instanceof Error ? err.message : 'Erro desconhecido');
      // console.error('❌ [SellerOrdersView] Erro stack:', err instanceof Error ? err.stack : 'N/A');
      
      const errorMessage = err instanceof Error ? err.message : "Erro ao registrar justificativa";
      toast.error(`Erro: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const queryError = toQueryError(error);

  return (
    <OrderLossAsyncLayout
      loading={isLoading}
      error={queryError}
      loadingLabel="Carregando pedidos..."
      contentMinHeightClass="min-h-96"
    >
      <DefaultLayout>
      <div className="w-full mx-auto px-2 sm:px-4 bg-background/50">
        {/* Header */}
        <div className="mb-6">
            <h1 className="text-3xl font-display text-content-light dark:text-content-dark text-start">
            Meus Pedidos
          </h1>
          <p className="text-start text-gray-600 mt-2">
            Olá, <span className="font-semibold">{user?.name || "Vendedor"}</span> - Gerencie suas negociações
          </p>
        </div>

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
        {/* {stats.lostWithoutReason > 0 && (
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
        )} */}

        {/* Lista de Pedidos */}
        <div className="mb-6 p-3 rounded-lg bg-white">
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
              city: `${g.firstItem.CIDADE}`,
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
                weight: item.QTDPED,
                margin: item["MARGEM LUCRO"],
                freight: item.VLRFRETE,
                unitPrice: item.PREUNI,
                totalPrice: item.VLRFINAL,
              })),
            }))}
            onUpdateLossReason={handleUpdateLossReason}
            isSubmitting={isSubmitting}
          />
        </div>
      </div>
    </DefaultLayout>
    </OrderLossAsyncLayout>
  );
};

export default SellerOrdersView;
