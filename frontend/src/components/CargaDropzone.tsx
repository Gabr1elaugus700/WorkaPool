import { useDroppable } from '@dnd-kit/core'
import { Carga } from '@/types/cargas'
import { Truck } from 'lucide-react'
import { Button } from './ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from '../components/ui/dropdown-menu'
import clsx from 'clsx'
import { useAuth } from '@/auth/AuthContext'

type Props = {
  carga: Carga
  children: React.ReactNode
  onChangeSituacao: (id: string, novaSituacao: string) => void
}

export default function CargaDropzone({ carga, children, onChangeSituacao }: Props) {
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
          )} kg
        </h4>
        {user?.role && ["LOGISTICA", "ADMIN"].includes(user.role) && (
          <div className='flex justify-end'>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  className='bg-emerald-600 text-white rounded hover:bg-emerald-700 w-12 h-12 mr-2'
                >
                  <Truck className='!w-6 !h-6' />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent>
                {['ABERTA', 'FECHADA', 'SOLICITADA', 'CANCELADA'].map((situacao) => (
                  <DropdownMenuItem
                    key={situacao}
                    onClick={() => onChangeSituacao(carga.id, situacao)}
                  >
                    {situacao}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      <div className="flex flex-row flex-wrap gap-2">
        {Array.isArray(children) ? children : <>{children}</>}
      </div>

    </div>
  )
}
