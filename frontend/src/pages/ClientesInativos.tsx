import { useState } from "react"
import { useClientesInativos } from "@/hooks/useClientesInativosHook"
import { FiltrosInativos } from "../components/inativos/filtrosInativos"
import { ClientesInativosTable } from "../components/inativos/ClientesInativosTable"

export default function ClientesInativosPage() {
  const [filtros, setFiltros] = useState({
    codRep: 8,
    dataInicio: "2023-01-01",
    dataFim: "2024-01-01",
    diasSCompra: 30,
  })

  const { data, loading } = useClientesInativos(filtros)

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-bold">Análise de Clientes Inativos</h1>
      <FiltrosInativos onApply={setFiltros} />
      <ClientesInativosTable data={data} loading={loading} />
    </div>
  )
}
