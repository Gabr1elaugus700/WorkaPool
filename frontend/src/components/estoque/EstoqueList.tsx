import { useEffect, useState } from "react"
import { getProdutosEstoque, ProdutoEstoque } from "@/services/useProdutosEstoque"
import { CardProduto } from "./CardProdutos"
// import { ChartPieLabel } from "../charts/ChartPieLabel"

export function EstoqueList() {
  const [produtos, setProdutos] = useState<ProdutoEstoque[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getProdutosEstoque()
      .then(setProdutos)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-center text-gray-500">Carregando...</p>

  // const chartData = produtos.map((item) => ({
  //   label: item.PRODUTO,
  //   value: item.ESTOQUE,
  // }))

  return (
    <div className="space-y-6 p-4">
      {/* <ChartPieLabel
        title="Produtos em Alto Volume no Estoque"
        description={new Date().toLocaleString("pt-BR", {
          month: "long",
          year: "numeric",
        })}
        data={chartData}
      /> */}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {produtos.map((item, idx) => (
          <CardProduto key={idx} nome={item.PRODUTO} estoque={item.ESTOQUE} />
        ))}
      </div>
    </div>
  )
}
