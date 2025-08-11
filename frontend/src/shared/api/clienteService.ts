import { getBaseUrl } from '@/lib/apiBase';

export type Cliente = {
    id: number
    nome: string
    email: string
  }
  
  export async function buscarClientes(): Promise<Cliente[]> {
    const res = await fetch(`${getBaseUrl()}/api/clientes`)
    if (!res.ok) throw new Error('Erro ao buscar clientes')
    return await res.json()
  }