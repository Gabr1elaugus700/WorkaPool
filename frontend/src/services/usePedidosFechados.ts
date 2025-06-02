import { getBaseUrl } from '@/lib/apiBase';
import { Pedido, PedidoERP} from  '../types/cargas';


export const fetchPedidosFechados = async (codRep: number): Promise<Pedido[]> => {
  const response = await fetch(`${getBaseUrl()}/api/pedidosFechados?codRep=${codRep}`);
  if (!response.ok) throw new Error('Erro ao buscar pedidos');

  const data: PedidoERP[] = await response.json();

  const agrupado = new Map<string, Pedido>();

  data.forEach((item) => {
    const numPed = item.NUM_PED;

    if (!agrupado.has(numPed)) {
      agrupado.set(numPed, {
        id: numPed,
        numPed: String(numPed),
        cliente: item.CLIENTE,
        cidade: item.CIDADE,
        vendedor: item.VENDEDOR,
        codRep: item.CODREP,
        bloqueado: item.BLOQUEADO,
        peso: item.PESO,
        posCar: item.POSCAR,
        precoFrete: 0,
        produtos: [{
          nome: item.PRODUTOS,
          derivacao: item.DERIVACAO,
          peso: item.PESO,
        }]
      });
    } else {
      const existente = agrupado.get(numPed)!;
      existente.produtos!.push({
        nome: item.PRODUTOS?.trim() || 'Sem nome',
        derivacao: item.DERIVACAO,
        peso: item.PESO,
      });
      existente.peso += item.PESO;
  }
  });

  return Array.from(agrupado.values());
};
