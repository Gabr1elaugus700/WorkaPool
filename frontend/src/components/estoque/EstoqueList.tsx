// src/components/EstoqueList.tsx

import { useEffect, useState } from "react";
import { getProdutosEstoque, ProdutoEstoque } from "@/services/useProdutosEstoque";
import { CardProduto } from "./CardProdutos";

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
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 p-2 ">
      {produtos.map((item, idx) => (
        <CardProduto key={idx} nome={item.PRODUTO} estoque={item.ESTOQUE} />
      ))}
    </div>
  );
}
