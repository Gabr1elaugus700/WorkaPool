import { useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"

interface ClienteInativo {
  codcli: number
  nomcli: string
  foncli: string
  vendedor: string
  codrep: number
  produto: string
  qtd_total: number
}

export function ClientesInativosTable({
  data,
  loading,
}: {
  data: ClienteInativo[]
  loading: boolean
}) {
  const [expandido, setExpandido] = useState<number | null>(null)

  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    )
  }

  const agrupado = data.reduce((acc, item) => {
    if (!acc[item.codcli]) {
      acc[item.codcli] = {
        codcli: item.codcli,
        cliente: item.nomcli,
        telefone: item.foncli,
        vendedor: item.vendedor,
        produtos: [],
      }
    }

    acc[item.codcli].produtos.push({
      nome: item.produto,
      qtd: item.qtd_total,
    })

    return acc
  }, {} as Record<number, {
    codcli: number
    cliente: string
    telefone: string
    vendedor: string
    produtos: { nome: string; qtd: number }[]
  }>)

  return (
    <div className="space-y-4">
      {Object.values(agrupado).map((cliente) => (
        <div key={cliente.codcli} className="border rounded-md bg-emerald-300 shadow-s">
          <button
            onClick={() =>
              setExpandido(expandido === cliente.codcli ? null : cliente.codcli)
            }
            className="w-full flex justify-between items-center p-3 bg-emerald-300 hover:bg-emerald-500 text-black transition rounded-t-md"
          >
            <div>
              <div className="font-semibold">• {cliente.codcli} • {cliente.cliente} — {cliente.telefone} </div>
              {/* <div className="text-sm text-muted-foreground">
                {cliente.telefone} — {cliente.vendedor}
              </div> */}
            </div>
            <div className="text-sm text-muted-foreground">
              {expandido === cliente.codcli ? "▲" : "▼"}
            </div>
          </button>

          {expandido === cliente.codcli && (
            <ul className="px-4 pb-4">
              {cliente.produtos.map((prod, idx) => (
                <li
                  key={idx}
                  className="flex justify-between border-b py-2 text-sm "
                >
                  <span>{prod.nome}</span>
                  <span>{prod.qtd.toLocaleString("pt-BR")} kg</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  )
}
