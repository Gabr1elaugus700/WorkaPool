import { useMemo } from "react";
import DefaultLayout from "@/layout/DefaultLayout";
import { KPICards } from "../components/KPICards";
import { KanbanBoard } from "../components/KanbanBoard";
import { Separator } from "@/components/ui/separator";
import { mockSellers, calculateKPIs } from "../services/mockData";

export const OrderLossView = () => {
  // Calcular KPIs baseado nos dados mockados
  const kpiData = useMemo(() => calculateKPIs(mockSellers), []);

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
        <KPICards data={kpiData} />

        {/* Kanban Board */}
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Pedidos por Vendedor
          </h2>
          <KanbanBoard sellers={mockSellers} />
        </div>
      </div>
    </DefaultLayout>
  );
};

export default OrderLossView;
