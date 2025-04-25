import DefaultLayout from "../layout/DefaultLayout";
import React, { useState } from 'react';
import { Button } from "../components/Button";

const vendedores = [
  { id: 'v1', nome: 'João' },
  { id: 'v2', nome: 'Maria' },
  { id: 'v3', nome: 'Carlos' },
];

const produtos = [
  { id: 'p1', nome: 'Produto A' },
  { id: 'p2', nome: 'Produto B' },
  { id: 'p3', nome: 'Produto C' },
];

const VendedorMetas: React.FC = () => {
  const [metas, setMetas] = useState<{ [vId: string]: { [pId: string]: string } }>({});

  const handleMetaChange = (vendedorId: string, produtoId: string, value: string) => {
    setMetas((prev) => ({
      ...prev,
      [vendedorId]: {
        ...prev[vendedorId],
        [produtoId]: value,
      },
    }));
  };

  const salvarMetas = () => {
    console.log('Metas salvas:', metas);
    alert('Metas salvas no console 👌');
  };

  return (
    <DefaultLayout>
      <Button success> Salvar</Button>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Definição de Metas por Vendedor (em kg)</h1>
        <div className="overflow-auto bg-slat">
          <table className="table-auto border border-gray-700 w-full">
            <thead>
              <tr className="bg-gray-200">
                <th className="border ">Vendedor</th>
                {produtos.map((produto) => (
                  <th key={produto.id} className="border">{produto.nome}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {vendedores.map((vendedor) => (
                <tr key={vendedor.id}>
                  <td className="border p-2 font-semibold">{vendedor.nome}</td>
                  {produtos.map((produto) => (
                    <td key={produto.id} className="border p-2">
                      <input
                        type="number"
                        className="w-full border rounded px-2 py-1"
                        value={metas[vendedor.id]?.[produto.id] || ''}
                        onChange={(e) => handleMetaChange(vendedor.id, produto.id, e.target.value)}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Button
          onClick={salvarMetas}
        >
          Salvar Metas
        </Button>
      </div>
    </DefaultLayout>
  );
};

export default VendedorMetas;
