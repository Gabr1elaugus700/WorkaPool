import { useMemo, useState } from "react";
import DefaultLayout from "@/layout/DefaultLayout";
import { SellersList } from "../components/SellersList";
import FilterButtons from "../components/FilterButtons";
import ExportButton from "../components/ExportButton";
import { OrderLossAsyncLayout } from "../components/OrderLossAsyncLayout";
import { useLostOrdersFromSapiens, useOrders } from "../hooks/useOrders";
import {
  Seller,
  LostOrderFromSapiens,
  LegacyOrder,
} from "../types/orderLoss.types";

type FilterType = "all" | "pending" | "justified";
type DateFilterType = "all" | "today" | "week" | "month";

function toQueryError(err: unknown): Error | null {
  if (!err) return null;
  if (err instanceof Error) return err;
  return new Error(String(err));
}

export const OrderLossView = () => {
  const {
    data: sapiensOrders = [],
    isLoading: loadingSapiens,
    error: errSapiens,
  } = useLostOrdersFromSapiens({});

  const {
    data: localOrders = [],
    isLoading: loadingLocal,
    error: errLocal,
  } = useOrders();

  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [dateFilter, setDateFilter] = useState<DateFilterType>("all");

  const loading = loadingSapiens || loadingLocal;
  const error = toQueryError(errSapiens ?? errLocal);

  const sellers = useMemo(() => {
    const sellerMap = new Map<string, Seller>();

    const sapiensOrdersMap = new Map<string, LostOrderFromSapiens[]>();
    sapiensOrders.forEach((order) => {
      if (!sapiensOrdersMap.has(order.NUMPED)) {
        sapiensOrdersMap.set(order.NUMPED, []);
      }
      sapiensOrdersMap.get(order.NUMPED)!.push(order);
    });

    const justifiedOrderNumbers = new Set(
      localOrders
        .filter((o) => o.lossReason !== null)
        .map((o) => String(o.order.orderNumber)),
    );

    sapiensOrders.forEach((sapiensOrder) => {
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

      const legacyOrder: LegacyOrder = {
        id: sapiensOrder.NUMPED,
        orderNumber: sapiensOrder.NUMPED,
        clientName: sapiensOrder.FANTASIA,
        status: "lost",
        city: sapiensOrder.CIDADE,
        seller: sapiensOrder.APEREP,
        sellerId: sapiensOrder.CODREP.toString(),
        totalWeight: sapiensOrder.QTDPED,
        averageMargin: sapiensOrder["MARGEM LUCRO"],
        totalValue: sapiensOrder.VLRFINAL,
        createdAt: new Date(sapiensOrder.DATA),
        updatedAt: new Date(sapiensOrder.DATA),
        products: [
          {
            id: `${sapiensOrder.NUMPED}-${sapiensOrder.CODPRO}`,
            name: sapiensOrder.PRODUTO,
            quantity: sapiensOrder.QTDPED,
            weight: sapiensOrder.QTDPED,
            margin: sapiensOrder["MARGEM LUCRO"],
            freight: sapiensOrder.VLRFRETE,
            unitPrice: sapiensOrder.PREUNI,
            totalPrice: sapiensOrder.VLRFINAL,
          },
        ],
      };

      seller.orders.push(legacyOrder);
    });

    localOrders.forEach((localOrder) => {
      if (!localOrder.lossReason) return;

      const sellerId = localOrder.order.codRep;

      if (!sellerMap.has(sellerId)) {
        const sapiensRef = sapiensOrders.find(
          (s) => s.CODREP.toString() === sellerId,
        );
        sellerMap.set(sellerId, {
          id: sellerId,
          name: sapiensRef?.APEREP || `Vendedor ${sellerId}`,
          orders: [],
        });
      }

      const seller = sellerMap.get(sellerId)!;

      const sapiensProducts =
        sapiensOrdersMap.get(String(localOrder.order.orderNumber)) || [];

      const firstSapiensItem = sapiensProducts[0];

      const legacyOrder: LegacyOrder = {
        id: localOrder.order.id,
        orderNumber: String(localOrder.order.orderNumber),
        clientName: firstSapiensItem?.FANTASIA || "Cliente",
        city: firstSapiensItem?.CIDADE || "Cidade",
        status: "lost",
        seller: seller.name,
        sellerId: localOrder.order.codRep,
        totalWeight: sapiensProducts.reduce((sum, item) => sum + item.QTDPED, 0),
        averageMargin:
          sapiensProducts.length > 0
            ? sapiensProducts.reduce(
                (sum, item) => sum + item["MARGEM LUCRO"],
                0,
              ) / sapiensProducts.length
            : 0,
        totalValue: sapiensProducts.reduce(
          (sum, item) => sum + item.VLRFINAL,
          0,
        ),
        createdAt: new Date(localOrder.order.createdAt),
        updatedAt: new Date(localOrder.order.updatedAt),
        products:
          sapiensProducts.length > 0
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
            : localOrder.products.map((p) => ({
                id: p.id,
                name: p.description || p.codprod,
                quantity: 0,
                weight: 0,
                margin: 0,
                freight: 0,
                unitPrice: 0,
                totalPrice: 0,
              })),
        lossReasonDetail: localOrder.lossReason
          ? {
              id: localOrder.lossReason.id,
              orderId: localOrder.lossReason.orderId,
              code: localOrder.lossReason.code,
              description: localOrder.lossReason.description,
              submittedBy: localOrder.lossReason.submittedBy,
              submittedAt: localOrder.lossReason.submittedAt,
            }
          : undefined,
      };

      seller.orders.push(legacyOrder);
    });

    return Array.from(sellerMap.values());
  }, [sapiensOrders, localOrders]);

  const filteredSellers = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

    return sellers
      .map((seller) => ({
        ...seller,
        orders: seller.orders.filter((order) => {
          let statusMatch = true;
          if (activeFilter === "pending") {
            statusMatch = !order.lossReasonDetail;
          } else if (activeFilter === "justified") {
            statusMatch = !!order.lossReasonDetail;
          }

          let dateMatch = true;
          const orderDate = new Date(order.createdAt);
          if (dateFilter === "today") {
            dateMatch = orderDate >= startOfToday;
          } else if (dateFilter === "week") {
            dateMatch = orderDate >= oneWeekAgo;
          } else if (dateFilter === "month") {
            dateMatch = orderDate >= oneMonthAgo;
          }

          return statusMatch && dateMatch;
        }),
      }))
      .filter((seller) => seller.orders.length > 0);
  }, [sellers, activeFilter, dateFilter]);

  const filterStats = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

    let totalPending = 0;
    let totalJustified = 0;
    let totalAll = 0;

    sellers.forEach((seller) => {
      seller.orders.forEach((order) => {
        const orderDate = new Date(order.createdAt);
        let includeOrder = true;

        if (dateFilter === "today") {
          includeOrder = orderDate >= startOfToday;
        } else if (dateFilter === "week") {
          includeOrder = orderDate >= oneWeekAgo;
        } else if (dateFilter === "month") {
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

  return (
    <OrderLossAsyncLayout
      loading={loading}
      error={error}
      loadingLabel="Carregando pedidos perdidos..."
    >
      <DefaultLayout>
        <div className="w-full mx-auto px-2 sm:px-4 justify-start">
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
    </OrderLossAsyncLayout>
  );
};

export default OrderLossView;
