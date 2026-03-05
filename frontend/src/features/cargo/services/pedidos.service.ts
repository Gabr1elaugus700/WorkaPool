import { getBaseUrl } from '@/lib/apiBase';
import { Pedido, PedidoERP } from '../types/cargo.types';

export const fetchPedidosFechados = async (codRep: number): Promise<Pedido[]> => {
  const response = await fetch(`${getBaseUrl()}/api/cargo/pedidos-fechados/${codRep}`);
  if (!response.ok) throw new Error('Erro ao buscar pedidos');

  const data: PedidoERP[] = await response.json();

  const agrupado = new Map<string, Pedido>();

  data.forEach((item) => {
    const numPed = item.NUM_PED;

    if (!agrupado.has(numPed)) {
      agrupado.set(numPed, {
        id: numPed,
        numPed: String(numPed),
        codCli: item.COD_CLI,
        cliente: item.CLIENTE,
        cidade: item.CIDADE,
        estado: item.ESTADO,
        vendedor: item.VENDEDOR,
        codRep: item.CODREP ?? undefined,
        bloqueado: item.BLOQUEADO,
        peso: item.PESO,
        poscar: item.POSCAR,  // minúsculo
        sitcar: item.SITCAR,  // minúsculo
        precoFrete: 0,
        produtos: [{
          nome: item.PRODUTOS,
          derivacao: item.DERIVACAO,
          quantidade: item.QUANTIDADE,  // incluir quantidade
          peso: item.PESO,
        }]
      });
    } else {
      const existente = agrupado.get(numPed)!;
      existente.produtos!.push({
        nome: item.PRODUTOS?.trim() || 'Sem nome',
        derivacao: item.DERIVACAO,
        quantidade: item.QUANTIDADE,  // incluir quantidade
        peso: item.PESO,
      });
      existente.peso += item.PESO;
    }
  });

  return Array.from(agrupado.values());
};

/**
 * Busca pedidos de uma carga específica
 * @param codCar - Código da carga
 * @param codRep - (Opcional) Código do vendedor para filtrar pedidos
 * @returns Array de pedidos (backend já retorna agrupados)
 */
export async function fetchPedidosCargas(
  codCar: number,
  codRep?: number
): Promise<Pedido[]> {
  const url = codRep 
    ? `${getBaseUrl()}/api/cargo/${codCar}/pedidos?codRep=${codRep}`
    : `${getBaseUrl()}/api/cargo/${codCar}/pedidos`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Erro ao buscar pedidos dessa Carga');
  }

  // Backend já retorna pedidos agrupados via mapRawToPedidos
  const pedidos: Pedido[] = await response.json();
  return pedidos;
}

export async function updatePedidoCarga(
  numPed: number,
  codCar?: number,
  posCar?: number
): Promise<void> {
  if (!numPed) {
    throw new Error("Número do pedido é obrigatório");
  }
  
  const response = await fetch(`${getBaseUrl()}/api/cargo/pedido/${numPed}`, {
    method: 'PUT',
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ codCar, posCar }),
  });

  if (!response.ok) {
    const erro = await response.json();
    throw new Error(erro.error);
  }
}

export async function salvarPedidosCargaFechada(codCar: string, pedidos: number[]) {
  const response = await fetch(`${getBaseUrl()}/api/cargo/carga-pedidos/${codCar}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ pedidos }),
  });

  if (!response.ok) {
    throw new Error('Erro ao salvar pedidos na carga.');
  }

  return response.json();
}
