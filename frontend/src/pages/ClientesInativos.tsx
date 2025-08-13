import { useState } from "react"
import { useClientesInativos } from "@/hooks/useClientesInativosHook"
import { FiltrosInativos } from "../components/inativos/FiltrosInativos"
import { ClientesInativosTable } from "../components/inativos/ClientesInativosTable"
import DefaultLayout from "@/shared/components/layout/DefaultLayout"
import { useAuth } from '@/auth/AuthContext';
import { Skeleton } from "@/features/ui/skeleton"

export default function ClientesInativosPage() {
  const { user } = useAuth();

  const [filtros, setFiltros] = useState(() => ({
    codRep: user?.codRep || 0,
    dataInicio: "2023-01-01",
    dataFim: "2024-01-01",
    diasSCompra: 30,
  }))

  const { data, loading } = useClientesInativos(filtros)

  const carregandoUser = !user?.codRep

  return (
    <DefaultLayout>
      <div className="p-6 space-y-6">
        <h1 className="text-xl font-bold">Análise de Clientes Inativos</h1>

        {carregandoUser ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-80 w-full" />
          </div>
        ) : (
          <>
            <FiltrosInativos onApply={setFiltros} />
            <ClientesInativosTable data={data} loading={loading} />
          </>
        )}
      </div>
    </DefaultLayout>
  )
}
