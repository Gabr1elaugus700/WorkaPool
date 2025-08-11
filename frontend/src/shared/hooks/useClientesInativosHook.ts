import { useEffect, useState } from "react"
import { fetchClientesInativos } from "@/shared/api/useClientesInativos"

interface ClienteInativo {
  codcli: number
  nomcli: string
  foncli: string
  vendedor: string
  codrep: number
  produto: string
  qtd_total: number
}

export const useClientesInativos = ({
  codRep,
  dataInicio,
  dataFim,
  diasSCompra,
}: {
  codRep: number
  dataInicio: string
  dataFim: string
  diasSCompra: number
}) => {
  const [data, setData] = useState<ClienteInativo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)

      const result = await fetchClientesInativos({
        codRep,
        dataInicio,
        dataFim,
        diasSCompra,
      })

      setData(result)
      setLoading(false)
    }

    fetchData()
  }, [codRep, dataInicio, dataFim, diasSCompra])

  return { data, loading }
}
