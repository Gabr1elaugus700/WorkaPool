import { useDraggable } from '@dnd-kit/core'
import { Pedido } from '@/types/cargas'

type Props = {
    pedido: Pedido
}

export default function PedidoCard({ pedido }: Props) {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: pedido.id,
        data: { pedido },
    })

    const situacaoClass = {
        pendente: 'bg-emerald-100 border-emerald-400',
        alerta: 'bg-yellow-100 border-orange-400',
        atraso: 'bg-red-200 border-red-700',
    }[pedido.situacao]

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            className={`min-w-[200px] max-w-[220px] border rounded p-2 shadow cursor-move ${situacaoClass} mb-3`}
            style={{
                transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined,
            }}
        >


            <p className="font-bold items-center text-lg">{pedido.cidade}</p>
            <p>{pedido.cliente} - {pedido.peso}kg</p>
            <p>Frete: R${pedido.precoFrete}</p>
            <p className="text-sm italic text-gray-600">Situação: {pedido.situacao}</p>
        </div>
    )
}
