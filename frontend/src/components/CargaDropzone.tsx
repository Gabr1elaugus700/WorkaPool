import { useDroppable } from '@dnd-kit/core'
import { Carga } from '@/types/cargas'
// import { Truck } from 'lucide-react'
import { EditarCargaModal } from './EditarCargaModal'
import clsx from 'clsx'
import { useAuth } from '@/auth/AuthContext'

type Props = {
  carga: Carga
  children: React.ReactNode
  onChangeSituacao: (id: string, novaSituacao: string) => void
  onUpdate: (cargaAtualizada: Carga) => void
}

export default function CargaDropzone({ carga, children, onUpdate }: Props) {
  const { setNodeRef } = useDroppable({ id: carga.id })

  const { user } = useAuth()

  return (
    <div
      ref={setNodeRef}
      className={clsx(
        'border-2 rounded mb-4 min-h-[150px] p-4',
        {
          'bg-yellow-300 shadow-md': carga.situacao === 'SOLICITADA',
          'bg-gray-200 shadow-md': carga.situacao === 'ABERTA',
          'bg-green-500 shadow-md': carga.situacao === 'FECHADA',
          'bg-red-700 shadow-md': carga.situacao === 'CANCELADA',
        }
      )}
    >
      {/* bg-gray-200 shadow-md */}
      <div className='grid grid-cols-3 gap-3 p-6'>
        <h2 className="text-lg font-bold mb-3 ">
          Carga: {carga.destino} • {carga.situacao}  <br />
        </h2>
        <h4>
          Capacidade: {carga.pesoMax}kg Máx • Utilizado: {carga.pesoAtual.toLocaleString('pt-BR',
            { minimumFractionDigits: 2, maximumFractionDigits: 2 } 
          )} kg • Custo: R${carga.custoMin}
        </h4>
        {user?.role && ["LOGISTICA", "ADMIN"].includes(user.role) && (
          <div className='flex justify-end'>
            <EditarCargaModal
              carga={carga}
              onUpdated={onUpdate}
            />


          </div>
        )}
      </div>

      <div className="flex flex-row flex-wrap gap-2">
        {Array.isArray(children) ? children : <>{children}</>}
      </div>

    </div>
  )
}
