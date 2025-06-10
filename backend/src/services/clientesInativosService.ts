import { BuscarClientesInativos } from '../repositories/clientesInativosRepository';
import { ClienteInativo } from '../types/clientes'


export const getClientesInativos = async (
  inicio: string,
  fim: string,
  codRep: number,
  diasSCompra: number
): Promise<ClienteInativo[]> => {
  try {
    const clientes = await BuscarClientesInativos(inicio, fim, codRep, diasSCompra)

    const clientesFormatados = clientes.map(cliente => ({
      ...cliente,
      nomcli: cliente.nomcli?.trim() || '',
      produto: cliente.produto?.trim() || '',
      vendedor: cliente.vendedor?.trim() || '',
      periodo: cliente.periodo?.trim() || '',
    }))

    return clientesFormatados
  } catch (error) {
    console.error("(SERVICE!)Erro ao buscar clientes inativos:", error)
    throw new Error("(SERVICE!)Erro ao buscar clientes inativos")
  }
}