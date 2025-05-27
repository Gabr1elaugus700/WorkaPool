import { useDroppable } from '@dnd-kit/core'

type Props = {
  children: React.ReactNode
}

export default function PedidoDropzone({ children }: Props) {
  const { setNodeRef } = useDroppable({ id: 'pedidos' })

  return (
    <div
      ref={setNodeRef}
      className="border-2 rounded p-4 mb-4 min-h-[100px] bg-gray-400 shadow-md w-full col-span-2 flex flex-col items-center"
    >
      <h1 className="text-3xl font-bold mb-4 text-center">Pedidos</h1>
      <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
        {children}
      </div>
    </div>

  )
}
