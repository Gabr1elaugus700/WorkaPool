import DefaultLayout from "../layout/DefaultLayout";
import React, { useState, useEffect } from "react";
import { fetchProdutos } from "../services/useProdutos";
import { fetchVendedores } from "../services/useVendedores";


type ProdutoBase = {
  COD_GRUPO: string;
  PRODUTOS: string;
};

type Vendedor = {
  COD_REP: number;
  NOME_REP: string;
  APE_REP: string;
};

const VendedorMetas: React.FC = () => {
  const [metas, setMetas] = useState<{ [vId: number]: { [codGrupo: string]: string } }>({});
  const [produtos, setProdutos] = useState<ProdutoBase[]>([]);
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const carregarDados = async () => {
      try {
        const [produtosData, vendedoresData] = await Promise.all([
          fetchProdutos(),
          fetchVendedores(),
        ]);
        setProdutos(produtosData);
        setVendedores(vendedoresData);
      } catch (error) {
        console.error("❌ Erro ao carregar dados:", error);
      } finally {
        setLoading(false);
      }
    };

    carregarDados();
  }, []);

  const handleMetaChange = (vendedorId: number, codGrupo: string, value: string) => {
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

        <div className="max-h-[80vh] overflow-auto border rounded-xl">
          <table className="min-w-full border-collapse">
            <thead className="sticky top-0 z-10 bg-white">
              <tr>
                <th className="sticky top-0 left-0 z-30 bg-white px-4 py-2 w-[160px] text-left">####</th>

                {vendedores.map((v) => (
                  <th key={v.COD_REP} className="bg-white px-4 py-2 text-center">
                    {v.APE_REP}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {produtos.map((p, i) => (
                <tr key={p.COD_GRUPO} className={i % 2 === 0 ? "bg-white" : "bg-gray-100"}>
                  <td className="sticky left-0 z-10 bg-emerald-300 px-4 py-2 font-medium">
                    {p.PRODUTOS}
                  </td>
                  {vendedores.map((v) => (
                    <td key={v.COD_REP} className="px-2 py-1">
                      <input
                        type="number"
                        inputMode="numeric"
                        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-center shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                        value={metas[v.COD_REP]?.[p.COD_GRUPO] || ""}
                        onChange={(e) =>
                          handleMetaChange(v.COD_REP, p.COD_GRUPO, e.target.value)
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
