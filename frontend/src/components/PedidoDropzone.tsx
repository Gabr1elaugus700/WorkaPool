import { useDroppable } from '@dnd-kit/core'

type Props = {
  children: React.ReactNode
}

export default function PedidoDropzone({ children }: Props) {
  const { setNodeRef } = useDroppable({ id: 'pedidos' })

  return (
    <div ref={setNodeRef} className="border-2 rounded p-4 mb-4 min-h-[150px] bg-gray-400 shadow-md flex justify-center flex-col items-center w-full">
      <h1 className="text-3xl font-bold mb-4 flex items-center">Pedidos</h1>
      {children}
    </div>
  )
}
