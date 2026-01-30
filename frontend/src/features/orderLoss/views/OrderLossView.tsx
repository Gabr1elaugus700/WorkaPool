import { useState, useEffect } from "react";
import DefaultLayout from "@/layout/DefaultLayout";
import { KPICards } from "../components/KPICards";
// import { KanbanBoard } from "../components/KanbanBoard";
import { Separator } from "@/components/ui/separator";
import { OrderService } from "../services/ordersServices";
import { SellerWithOrders, KPIData, LostOrderFromSapiens } from "../types/orderLoss.types";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export const OrderLossView = () => {
  // const [sellers, setSellers] = useState<SellerWithOrders[]>([]);
  const [kpis, setKpis] = useState<KPIData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data: LostOrderFromSapiens[] = await OrderService.getLost();

      // Agrupar pedidos por vendedor
      const sellerMap = new Map<number, SellerWithOrders>();

      data.forEach((order) => {
        const sellerId = order.CODREP;
        
        if (!sellerMap.has(sellerId)) {
          sellerMap.set(sellerId, {
            sellerId: String(sellerId),
            sellerName: order.APEREP,
            sellerCode: sellerId,
            orders: [],
            stats: {
              totalOrders: 0,
              negotiatingOrders: 0,
              lostOrders: 0,
              totalWeight: 0,
              totalValue: 0,
              averageMargin: 0,
              lostWithoutReason: 0,
              negotiatingValue: 0,
            },
          });
        }

        const seller = sellerMap.get(sellerId)!;
        seller.orders.push(order);
      });

      // Calcular estatísticas para cada vendedor
      

      // Calcular KPIs globais
      const totalOrders = data.length;
      const totalValue = data.reduce((sum, order) => sum + order.VLRFINAL, 0);
      // const totalWeight = data.reduce((sum, order) => sum + order.QTDPED, 0);
      const averageMargin = totalOrders > 0
        ? data.reduce((sum, order) => sum + order["MARGEM LUCRO"], 0) / totalOrders
        : 0;

      const kpisData: KPIData = {
        weightInNegotiation: 0, // SAPIENS só retorna perdidos
        averageMargin,
        activeNegotiations: 0,
        totalOrders,
        lostOrders: totalOrders,
        totalValue,
      };

      // setSellers(sellersData);
      setKpis(kpisData);
    } catch (err) {
      console.error('Erro ao carregar pedidos:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar pedidos');
    } finally {
      setLoading(false);
    }
  };

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
      <div className="w-full mx-auto px-2 sm:px-4 bg-white/50">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-content-light dark:text-content-dark text-center">
            Gestão de Pedidos
          </h1>
          <p className="text-center text-gray-600 mt-2">
            Acompanhe negociações em andamento e pedidos perdidos
          </p>
        </div>

        <Separator className="my-4 bg-[#17cf54]" />

        {/* KPI Cards */}
        {kpis && <KPICards data={kpis} />}

        {/* Kanban Board */}
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Pedidos por Vendedor
          </h2>
          
          {/* <KanbanBoard sellers={sellers} /> */}
        </div>
      </div>
    </DefaultLayout>
  );
};

export default OrderLossView;
