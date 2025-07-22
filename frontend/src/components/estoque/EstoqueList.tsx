// src/components/EstoqueList.tsx
import { useEffect, useState } from "react";
import { getProdutosEstoque, ProdutoEstoque } from "@/services/useProdutosEstoque";
import { CardProduto } from "./CardProdutos";
// import { ChartPieLabel } from "../charts/ChartPieLabel";

export function EstoqueList() {
  const [produtos, setProdutos] = useState<ProdutoEstoque[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProdutosEstoque()
      .then((data) => setProdutos(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-center text-gray-500">Carregando...</p>;

  return (
    <div className="space-y-6 p-4">
      {/* <div className="w-full max-w-md mx-auto">
        <ChartPieLabel produtos={produtos} />
      </div> */}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {produtos.map((item, idx) => (
          <CardProduto key={idx} nome={item.PRODUTO} estoque={item.ESTOQUE} />
        ))}
      </div>
    </div>
  );
}
