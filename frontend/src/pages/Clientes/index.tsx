// frontend/src/pages/Clientes.tsx
import { useEffect, useState } from 'react'
import { buscarClientes, Cliente } from '@/shared/api/clienteService'
import DefaultLayout from "@/layout/DefaultLayout";

export function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([])

  useEffect(() => {
    buscarClientes().then(setClientes).catch(console.error)
  }, [])

  return (
    <DefaultLayout>
      <div className="p-4">
        <h1 className="text-xl font-bold mb-2">Clientes</h1>
        <ul>
          {clientes.map(cliente => (
            <li key={cliente.id}>
              <strong>{cliente.nome}</strong> — {cliente.email}
            </li>
          ))}
        </ul>
      </div>
    </DefaultLayout>
  )
}

export default Clientes