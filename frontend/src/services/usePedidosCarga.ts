import { getBaseUrl } from '@/lib/apiBase';
import { Pedido } from '@/types/cargas';
import { PedidoERP } from '@/types/cargas';

export async function fetchPedidosCargas(codCar: number): Promise<Pedido[]> {
  const response = await fetch(`${getBaseUrl()}/api/pedidosEmCargas?codCar=${codCar}`);

  if (!response.ok) throw new Error('Erro ao buscar pedidos dessa Carga');

  const dados: PedidoERP[] = await response.json();

  const agrupado = new Map<string, Pedido>();

  dados.forEach((item) => {
    const numPed = item.NUM_PED;

    if (!agrupado.has(numPed)) {
      agrupado.set(numPed, {
        id: numPed,
        numPed: numPed,
        cliente: item.CLIENTE,
        cidade: item.CIDADE,
        vendedor: item.VENDEDOR,
        codRep: item.CODREP ?? null,
        bloqueado: item.BLOQUEADO,
        peso: item.PESO,
        precoFrete: 0,
        codCar: item.CODCAR ?? null,
        posCar: item.POSCAR,
        produtos: [{
          nome: item.PRODUTOS?.trim() || 'Sem nome',
          derivacao: item.DERIVACAO,
          peso: item.PESO,
        }],
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
}
