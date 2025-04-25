export type Cliente = {
    id: number
    nome: string
    email: string
  }
  
  export async function buscarClientes(): Promise<Cliente[]> {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/clientes`)
    if (!res.ok) throw new Error('Erro ao buscar clientes')
    return await res.json()
  }