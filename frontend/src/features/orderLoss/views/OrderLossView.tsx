import { useState, useEffect, useMemo } from "react";
import DefaultLayout from "@/layout/DefaultLayout";
import { SellersList } from "../components/SellersList";
import FilterButtons from "../components/FilterButtons";
import ExportButton from "../components/ExportButton";
import { OrderService } from "../services/ordersServices";
import { Seller, LostOrderFromSapiens, OrderWithLossReason, LegacyOrder } from "../types/orderLoss.types";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type FilterType = 'all' | 'pending' | 'justified';
type DateFilterType = 'all' | 'today' | 'week' | 'month';

export const OrderLossView = () => {
  const [sapiensOrders, setSapiensOrders] = useState<LostOrderFromSapiens[]>([]);
  const [localOrders, setLocalOrders] = useState<OrderWithLossReason[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [dateFilter, setDateFilter] = useState<DateFilterType>('all');

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Buscar pedidos do SAPIENS (perdidos)
      const sapiensData = await OrderService.getLost();
      setSapiensOrders(sapiensData);

      // Buscar pedidos locais (já justificados)
      const localData = await OrderService.getAll();
      setLocalOrders(localData);

      const justifiedCount = localData.filter(o => o.lossReason !== null).length;
      
      console.log('📊 Pedidos carregados:', {
        sapiens: sapiensData.length,
        local: localData.length,
        justificados: justifiedCount
      });
      
      // Debug: verificar nomes de vendedores
      if (sapiensData.length > 0) {
        console.log('🔍 Exemplo de vendedor:', {
          CODREP: sapiensData[0].CODREP,
          APEREP: sapiensData[0].APEREP,
        });
      }
    } catch (err) {
      console.error('Erro ao carregar pedidos:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar pedidos');
    } finally {
      setLoading(false);
    }
  };

  // Organizar pedidos por vendedor
  const sellers = useMemo(() => {
    const sellerMap = new Map<string, Seller>();

    // Criar mapa de pedidos SAPIENS por número para acesso rápido
    const sapiensOrdersMap = new Map<string, LostOrderFromSapiens[]>();
    sapiensOrders.forEach(order => {
      if (!sapiensOrdersMap.has(order.NUMPED)) {
        sapiensOrdersMap.set(order.NUMPED, []);
      }
      sapiensOrdersMap.get(order.NUMPED)!.push(order);
    });

    // Primeiro, criar conjunto de pedidos já justificados
    const justifiedOrderNumbers = new Set(
      localOrders
        .filter(o => o.lossReason !== null)
        .map(o => o.order.orderNumber)
    );

    // Agrupar pedidos do SAPIENS (não justificados) por vendedor
    sapiensOrders.forEach((sapiensOrder) => {
      // Pular se já foi justificado
      if (justifiedOrderNumbers.has(sapiensOrder.NUMPED)) return;

      const sellerId = sapiensOrder.CODREP.toString();
      
      if (!sellerMap.has(sellerId)) {
        sellerMap.set(sellerId, {
          id: sellerId,
          name: sapiensOrder.APEREP || `Vendedor ${sellerId}`,
          orders: [],
        });
      }

      const seller = sellerMap.get(sellerId)!;
      
      // Converter para LegacyOrder
      const legacyOrder: LegacyOrder = {
        id: sapiensOrder.NUMPED,
        orderNumber: sapiensOrder.NUMPED,
        clientName: sapiensOrder.FANTASIA,
        status: 'lost',
        city: sapiensOrder.CIDADE,
        seller: sapiensOrder.APEREP,
        sellerId: sapiensOrder.CODREP.toString(),
        totalWeight: sapiensOrder.QTDPED,
        averageMargin: sapiensOrder["MARGEM LUCRO"],
        totalValue: sapiensOrder.VLRFINAL,
        createdAt: new Date(sapiensOrder.DATA),
        updatedAt: new Date(sapiensOrder.DATA),
        products: [{
          id: `${sapiensOrder.NUMPED}-${sapiensOrder.CODPRO}`,
          name: sapiensOrder.PRODUTO,
          quantity: sapiensOrder.QTDPED,
          weight: sapiensOrder.QTDPED,
          margin: sapiensOrder["MARGEM LUCRO"],
          freight: sapiensOrder.VLRFRETE,
          unitPrice: sapiensOrder.PREUNI,
          totalPrice: sapiensOrder.VLRFINAL,
        }],
      };

      seller.orders.push(legacyOrder);
    });

    // Adicionar pedidos locais justificados por vendedor
    localOrders.forEach((localOrder) => {
      if (!localOrder.lossReason) return; // Só mostrar os justificados

      const sellerId = localOrder.order.codRep;
      
      if (!sellerMap.has(sellerId)) {
        // Buscar nome do vendedor dos pedidos SAPIENS
        const sapiensRef = sapiensOrders.find(s => s.CODREP.toString() === sellerId);
        sellerMap.set(sellerId, {
          id: sellerId,
          name: sapiensRef?.APEREP || `Vendedor ${sellerId}`,
          orders: [],
        });
      }

      const seller = sellerMap.get(sellerId)!;
      
      // Buscar produtos do SAPIENS para este pedido
      const sapiensProducts = sapiensOrdersMap.get(localOrder.order.orderNumber) || [];
      
      // Pegar informações do primeiro item para dados gerais
      const firstSapiensItem = sapiensProducts[0];
      
      // Converter para LegacyOrder
      const legacyOrder: LegacyOrder = {
        id: localOrder.order.id,
        orderNumber: localOrder.order.orderNumber,
        clientName: firstSapiensItem?.FANTASIA || 'Cliente',
        city: firstSapiensItem?.CIDADE || 'Cidade',
        status: 'lost',
        seller: seller.name,
        sellerId: localOrder.order.codRep,
        totalWeight: sapiensProducts.reduce((sum, item) => sum + item.QTDPED, 0),
        averageMargin: sapiensProducts.length > 0
          ? sapiensProducts.reduce((sum, item) => sum + item["MARGEM LUCRO"], 0) / sapiensProducts.length
          : 0,
        totalValue: sapiensProducts.reduce((sum, item) => sum + item.VLRFINAL, 0),
        createdAt: new Date(localOrder.order.createdAt),
        updatedAt: new Date(localOrder.order.updatedAt),
        products: sapiensProducts.length > 0
          ? sapiensProducts.map((item, idx) => ({
              id: `${localOrder.order.orderNumber}-${idx}`,
              name: item.PRODUTO,
              quantity: item.QTDPED,
              weight: item.QTDPED,
              margin: item["MARGEM LUCRO"],
              freight: item.VLRFRETE,
              unitPrice: item.PREUNI,
              totalPrice: item.VLRFINAL,
            }))
          : localOrder.products.map(p => ({
              id: p.id,
              name: p.description || p.codprod,
              quantity: 0,
              weight: 0,
              margin: 0,
              freight: 0,
              unitPrice: 0,
              totalPrice: 0,
            })),
        lossReasonDetail: localOrder.lossReason ? {
          id: localOrder.lossReason.id,
          orderId: localOrder.lossReason.orderId,
          code: localOrder.lossReason.code,
          description: localOrder.lossReason.description,
          submittedBy: localOrder.lossReason.submittedBy,
          submittedAt: localOrder.lossReason.submittedAt,
        } : undefined,
      };

      seller.orders.push(legacyOrder);
    });

    const sellersList = Array.from(sellerMap.values());
    
    // Debug: verificar sellers criados
    console.log('👥 Vendedores carregados:', sellersList.map(s => ({
      id: s.id,
      name: s.name,
      totalOrders: s.orders.length
    })));
    
    return sellersList;
  }, [sapiensOrders, localOrders]);

  // Filtrar sellers baseado no filtro ativo e data
  const filteredSellers = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

    return sellers.map(seller => ({
      ...seller,
      orders: seller.orders.filter(order => {
        // Filtro de status
        let statusMatch = true;
        if (activeFilter === 'pending') {
          statusMatch = !order.lossReasonDetail;
        } else if (activeFilter === 'justified') {
          statusMatch = !!order.lossReasonDetail;
        }

        // Filtro de data
        let dateMatch = true;
        const orderDate = new Date(order.createdAt);
        if (dateFilter === 'today') {
          dateMatch = orderDate >= startOfToday;
        } else if (dateFilter === 'week') {
          dateMatch = orderDate >= oneWeekAgo;
        } else if (dateFilter === 'month') {
          dateMatch = orderDate >= oneMonthAgo;
        }

        return statusMatch && dateMatch;
      })
    })).filter(seller => seller.orders.length > 0);
  }, [sellers, activeFilter, dateFilter]);

  // Estatísticas para os filtros (considerando o filtro de data)
  const filterStats = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

    let totalPending = 0;
    let totalJustified = 0;
    let totalAll = 0;

    sellers.forEach(seller => {
      seller.orders.forEach(order => {
        // Aplicar filtro de data
        const orderDate = new Date(order.createdAt);
        let includeOrder = true;
        
        if (dateFilter === 'today') {
          includeOrder = orderDate >= startOfToday;
        } else if (dateFilter === 'week') {
          includeOrder = orderDate >= oneWeekAgo;
        } else if (dateFilter === 'month') {
          includeOrder = orderDate >= oneMonthAgo;
        }

        if (!includeOrder) return;

        totalAll++;
        if (order.lossReasonDetail) {
          totalJustified++;
        } else {
          totalPending++;
        }
      });
    });

    return { totalAll, totalPending, totalJustified };
  }, [sellers, dateFilter]);

  if (loading) {
    return (
      <DefaultLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-gray-600">Carregando pedidos perdidos...</p>
          </div>
        </div>
      </DefaultLayout>
    );
  }

  if (error) {
    return (
      <DefaultLayout>
        <div className="w-full mx-auto px-2 sm:px-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout>
      <div className="w-full mx-auto px-2 sm:px-4 justify-start">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-display text-content-light dark:text-content-dark text-start">
              Análise de Pedidos Perdidos
            </h1>
            <p className="text-start font-light text-gray-600 mt-2">
              Acompanhe negociações em andamento e pedidos perdidos
            </p>
          </div>
          <ExportButton 
            filteredSellers={filteredSellers} 
            activeFilter={activeFilter} 
          />
        </div>

        {/* Lista de Vendedores */}
        <div className="mt-6">
          <FilterButtons
            dateFilter={dateFilter}
            setDateFilter={setDateFilter}
            activeFilter={activeFilter}
            setActiveFilter={setActiveFilter}
            filterStats={filterStats}
          />

          {filteredSellers.length > 0 ? (
            <SellersList sellers={filteredSellers} />
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>Nenhum pedido encontrado</p>
            </div>
          )}
        </div>
      </div>
    </DefaultLayout>
  );
};

export default OrderLossView;
