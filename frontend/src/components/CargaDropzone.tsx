import { useDroppable } from '@dnd-kit/core'
import { Carga } from '@/types/cargas'
import { Truck } from 'lucide-react'
import { Button } from './ui/button'

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
      <div className='flex justify-between'>
        <h2 className="text-lg font-bold mb-3 text-wrap">
          Carga: {carga.codCar} <br />
          Peso: {carga.pesoMax}kg Máx / Utilizado: {carga.pesoAtual.toLocaleString('pt-BR',
            { minimumFractionDigits: 2, maximumFractionDigits: 2 }
          )} kg - {carga.destino}
        </h2>
        <Button className=' bg-emerald-600 text-white rounded hover:bg-emerald-700 w-12 h-12 mr-2'>
          <Truck className='!w-6 !h-6'/>
        </Button>

      </div>

      <div className="flex flex-row flex-wrap gap-2">
        {Array.isArray(children) ? children : <>{children}</>}
      </div>

    </div>
  )
}
