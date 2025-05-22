import { useState } from 'react'
import { DndContext, DragEndEvent } from '@dnd-kit/core'
import { Pedido, Carga } from '../types/cargas'
import DefaultLayout from '@/layout/DefaultLayout'
import { toast } from 'sonner'
import PedidoCard from '../components/pedidoCard'
import CargaDropzone from '@/components/CargaDropzone'
import PedidoDropzone from '@/components/PedidoDropzone'


const pedidoExemplo: Pedido[] = [
  {
    id: '001-A',
    cliente: 'Teste 1',
    cidade: 'Cianorte',
    peso: 500,
    vendedor: 'Vendedor X',
    precoFrete: 550,
    numPed: '001-A',
    situacao: 'pendente',
  },
  {
    id: '002-B',
    cliente: 'Teste 2',
    cidade: 'Umuarama',
    peso: 900,
    vendedor: 'Vendedor Y',
    precoFrete: 1250,
    numPed: '002-B',
    situacao: 'atraso',
  },
  {
    id: '001-C',
    cliente: 'Teste 3',
    cidade: 'Cianorte',
    peso: 500,
    vendedor: 'Vendedor X',
    precoFrete: 550,
    numPed: '001-A',
    situacao: 'alerta',
  },
  {
    id: '002-D',
    cliente: 'Teste 4',
    cidade: 'Umuarama',
    peso: 900,
    vendedor: 'Vendedor Y',
    precoFrete: 1250,
    numPed: '002-B',
    situacao: 'pendente',
  },
  {
    id: '001-E',
    cliente: 'Teste 5',
    cidade: 'Cianorte',
    peso: 500,
    vendedor: 'Vendedor X',
    precoFrete: 550,
    numPed: '001-A',
    situacao: 'atraso',
  },
  {
    id: '002-F',
    cliente: 'Teste 6',
    cidade: 'Umuarama',
    peso: 900,
    vendedor: 'Vendedor Y',
    precoFrete: 1250,
    numPed: '002-B',
    situacao: 'alerta',
  },
]


const cargasExemplo: Carga[] = [
  {
    id: 'carga-1',
    destino: 'Londrina',
    pesoMax: 2000,
    pesoAtual: 0,
    custoMinimo: 1200,
    pedidos: [],
  },
  {
    id: 'carga-2',
    destino: 'São Paulo',
    pesoMax: 14000,
    pesoAtual: 0,
    custoMinimo: 1300,
    pedidos: [],
  },
]
export default function HomePage() {
  const [pedidos, setPedidos] = useState<Pedido[]>(pedidoExemplo)
  const [cargas, setCargas] = useState<Carga[]>(cargasExemplo)

  const handleDragEnd = (event: DragEndEvent) => {
    const pedido = event.active.data.current?.pedido as Pedido
    const destinoId = event.over?.id?.toString()

    if (!pedido || !destinoId) return

    const isInPedidos = pedidos.some((p) => p.id === pedido.id)

    // 🛑 Impede soltar no mesmo lugar da lista de pedidos
    if (destinoId === 'pedidos' && isInPedidos) return

    // 🛑 Impede soltar o pedido na mesma carga onde ele já está
    if (destinoId !== 'pedidos') {
      const cargaAtual = cargas.find((c) =>
        c.pedidos.some((p) => p.id === pedido.id)
      )
      if (cargaAtual?.id === destinoId) return
    }

    // 👉 Se for soltar de volta na lista de pedidos
    if (destinoId === 'pedidos') {
      setPedidos((prev) => {
        if (prev.some((p) => p.id === pedido.id)) return prev
        return [...prev, pedido]
      })

      setCargas((prev) =>
        prev.map((c) => ({
          ...c,
          pedidos: c.pedidos.filter((p) => p.id !== pedido.id),
          pesoAtual: c.pedidos.some((p) => p.id === pedido.id)
            ? c.pesoAtual - pedido.peso
            : c.pesoAtual,
        }))
      )
      return
    }

    // 👉 Se estiver soltando em uma nova carga
    const cargaDestino = cargas.find((c) => c.id === destinoId)
    if (!cargaDestino) return

    const novoPeso = cargaDestino.pesoAtual + pedido.peso
    if (novoPeso > cargaDestino.pesoMax) {
      toast.error(`Carga excede o peso máximo de ${cargaDestino.pesoMax}kg!`)
      setPedidos((prev) => {
        if (prev.some((p) => p.id === pedido.id)) return prev
        return [...prev, pedido]
      })
      return
    }

    setPedidos((prev) => prev.filter((p) => p.id !== pedido.id))

    setCargas((prev) =>
      prev.map((c) =>
        c.id === destinoId
          ? {
            ...c,
            pedidos: [...c.pedidos, pedido],
            pesoAtual: c.pesoAtual + pedido.peso,
          }
          : {
            ...c,
            pedidos: c.pedidos.filter((p) => p.id !== pedido.id),
            pesoAtual: c.pedidos.some((p) => p.id === pedido.id)
              ? c.pesoAtual - pedido.peso
              : c.pesoAtual,
          }
      )
    )
  }


  return (
    <DefaultLayout>
      <DndContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-3 gap-6 p-6">

          <PedidoDropzone>
            {pedidos.map((pedido) => (
              <PedidoCard key={pedido.id} pedido={pedido} />
            ))}
          </PedidoDropzone>

          <div className="col-span-2 bg-gray-400 p-6 rounded shadow-md">
            <h1 className="text-3xl font-bold mb-4 flex justify-center items-center">Cargas</h1>
            {cargas.map((carga) => (
              <CargaDropzone key={carga.id} carga={carga}>
                {carga.pedidos.map((pedido) => (
                  <PedidoCard key={pedido.id} pedido={pedido} />
                ))}
              </CargaDropzone>
            ))}
          </div>
        </div>
      </DndContext>
    </DefaultLayout>
  )
}