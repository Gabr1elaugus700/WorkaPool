import DefaultLayout from "../layout/DefaultLayout";
import React, { useState, useEffect } from "react";
import { fetchProdutos } from "../services/useProdutos";

const vendedores = [
  { id: "v1", nome: "João" },
  { id: "v2", nome: "Maria" },
  { id: "v3", nome: "Carlos" },
];

type ProdutoBase = {
  COD_GRUPO: string;
  PRODUTOS: string;
};

const VendedorMetas: React.FC = () => {
  const [metas, setMetas] = useState<{ [vId: string]: { [codGrupo: string]: string } }>({});
  const [produtos, setProdutos] = useState<ProdutoBase[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const carregarProdutos = async () => {
      try {
        const data = await fetchProdutos();
        setProdutos(data);
      } catch (error) {
        console.error("❌ Erro ao carregar produtos:", error);
      } finally {
        setLoading(false);
      }
    };

    carregarProdutos();
  }, []);

  const handleMetaChange = (vendedorId: string, codGrupo: string, value: string) => {
    setMetas((prev) => ({
      ...prev,
      [vendedorId]: {
        ...prev[vendedorId],
        [codGrupo]: value,
      },
    }));
  };

  if (loading) return <div className="text-center p-4">Carregando...</div>;

  return (
    <DefaultLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Definição de Metas por Vendedor (em kg)</h1>
        <div className="overflow-auto">
          <table className="table-auto border border-gray-700 w-full">
            <thead>
              <tr className="bg-gray-200">
                <th className="border p-2 text-left">Produto</th>
                {vendedores.map((vendedor) => (
                  <th key={vendedor.id} className="border p-2 text-sm">
                    {vendedor.nome}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {produtos.map((produto) => (
                <tr key={produto.COD_GRUPO}>
                  <td className="border p-2 font-medium">{produto.PRODUTOS}</td>
                  {vendedores.map((vendedor) => (
                    <td key={vendedor.id} className="border p-2">
                      <input
                        type="number"
                        className="w-full border rounded px-2 py-1"
                        value={metas[vendedor.id]?.[produto.COD_GRUPO] || ""}
                        onChange={(e) =>
                          handleMetaChange(vendedor.id, produto.COD_GRUPO, e.target.value)
                        }
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DefaultLayout>
  );
};

export default VendedorMetas;
