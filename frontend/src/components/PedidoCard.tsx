import { useDraggable } from '@dnd-kit/core'
import { Pedido } from '@/types/cargas'

type Props = {
  pedido: Pedido
  produtos?: {
    nome: string
    derivacao: string
    peso: number
  }[];
}

export default function PedidoCard({ pedido, produtos }: Props) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: pedido.id,
    data: { pedido },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className="min-w-[200px] max-w-[220px] border rounded p-2 shadow cursor-move bg-emerald-200 mb-3 border-gray-400 hover:border-gray-500 transition-colors"
      style={{
        transform: transform
          ? `translate(${transform.x}px, ${transform.y}px)`
          : undefined,
      }}
    >
      <p className="font-bold text-lg">{pedido.cidade}</p>
      <p className="text-sm">{pedido.cliente}</p>
      <p className="text-sm font-bold">Vendedor: {pedido.vendedor}</p>
      <p className="text-sm">Peso total: {pedido.peso.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} kg</p>

      {produtos && (
        <ul className="text-xs mt-2 space-y-1">
          {produtos.map((prod, idx) => (
            <li key={idx} className="border-t pt-1">
              <span className="block font-medium">{prod.nome}</span>
              <span>Derivação: {prod.derivacao} • Peso: {prod.peso.toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }) }kg</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
