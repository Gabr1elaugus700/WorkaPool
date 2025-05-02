import DefaultLayout from "../layout/DefaultLayout";
import { useEffect, useState } from 'react'
import { Table, TableBody, TableHead, TableHeader } from '../components/ui/table'

type PedidoCarteira = {
  VENDEDOR: string
  GRUPO: string
  QUANTIDADE: number
  VALOR: number
}
const API = import.meta.env.VITE_API_URL

export default function PedidosCarteira() {
  const [dados, setDados] = useState<PedidoCarteira[]>([])

  useEffect(() => {
    fetch(`${API}/api/pedidos`)
      .then(res => res.json())
      .then(data => {
        console.log('dados recebidos:', data)
        setDados(data)
      })
      .catch(err => console.error('Erro:', err))
  }, [])

  return (
    <DefaultLayout>
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Pedidos por Vendedor Em Carteira</h1>
        <Table>
          <TableHeader>
            <TableHead className="w-[100px]">Vendedor</TableHead>
            <TableHead className="w-[100px]">Grupo</TableHead>
            <TableHead className="w-[100px]">Quantidade</TableHead>
            <TableHead className="w-[100px]">Valor</TableHead>
          </TableHeader>
          <TableBody>
            {dados.map((item, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="border px-4 py-2">{item.VENDEDOR}</td>
                <td className="border px-4 py-2">{item.GRUPO}</td>
                <td className="border px-4 py-2">{item.QUANTIDADE}</td>
                <td className="border px-4 py-2">R$ {item.VALOR.toFixed(2)}</td>
              </tr>
            ))}
          </TableBody>
        </Table>
        
      </div>
    </DefaultLayout >
  )
}
