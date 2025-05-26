import { useDroppable } from '@dnd-kit/core'
import { Carga } from '@/types/cargas'

type Props = {
  carga: Carga
  children: React.ReactNode
}

export default function CargaDropzone({ carga, children }: Props) {
  const { setNodeRef } = useDroppable({ id: carga.id })


  return (
    <div
      ref={setNodeRef}
      className={`border-2 rounded p-4 mb-4 min-h-[150px] bg-gray-200 shadow-md `}
    >
      <h2 className="text-lg font-bold mb-3">
        Carga: {carga.codCar} <br />
        Peso: {carga.pesoMax}kg Máx / Utilizado: {carga.pesoAtual}kg - {carga.destino}
      </h2>

     
      <div className="flex flex-row flex-wrap gap-2">
        {Array.isArray(children) ? children : <>{children}</>}
      </div>

    </div>
  )
}
