import { PedidoCargo } from '../types/PedidoCargo.types';
import { PedidoRaw } from '../types/PedidoRaw';
import { computePedidoIbcEligibility } from './computePedidoIbcEligibility';

/**
 * Converte linhas brutas do SQL (uma por produto/derivação)
 * em entidades Pedido agregadas (um por número de pedido).
 *
 * Elegibilidade IBC (CODIGO_EMBALAGEM 251001 + cálculo esperado) é agregada
 * no backend a partir dos campos expostos por QUERY_GET_PEDIDOS_BY_CARGA.
 */
export function mapRawToPedidos(rows: PedidoRaw[]): PedidoCargo[] {
  const map = new Map<string, PedidoCargo>();
  const linesByPedido = new Map<string, PedidoRaw[]>();

  for (const row of rows) {
    const numPed = String(row.NUM_PED);

    if (!map.has(numPed)) {
      map.set(
        numPed,
        new PedidoCargo({
          id: numPed,
          numPed,
          codCli: row.COD_CLI,
          cliente: row.CLIENTE,
          cidade: row.CIDADE,
          estado: row.ESTADO,
          vendedor: row.VENDEDOR,
          codRep: row.CODREP,
          bloqueado: row.BLOQUEADO,
          peso: 0,
          codCar: row.CODCAR ?? null,
          poscar: row.POSCAR ?? null,
          sitcar: row.SITCAR ?? null,
          qtdOri: row.QTD_ORI_PED,
          produtos: [],
        }),
      );
      linesByPedido.set(numPed, []);
    }

    const pedido = map.get(numPed)!;
    const lines = linesByPedido.get(numPed)!;

    pedido.peso += Number(row.PESO);
    lines.push(row);

    pedido.produtos!.push({
      nome: row.PRODUTOS?.trim() || '',
      derivacao: row.DERIVACAO,
      quantidade: row.QUANTIDADE,
      peso: row.PESO,
    });
  }

  for (const [numPed, pedido] of map) {
    const lines = linesByPedido.get(numPed) ?? [];
    const eligibility = computePedidoIbcEligibility(lines);
    pedido.isContainer = eligibility.isContainer;
    pedido.quantidadeEsperadaTotal = eligibility.quantidadeEsperadaTotal;
    pedido.quantidadeEsperadaVenda = eligibility.quantidadeEsperadaVenda;
    pedido.quantidadeEsperadaEmprestimo =
      eligibility.quantidadeEsperadaEmprestimo;
    pedido.ibcInvalido = eligibility.ibcInvalido;
  }

  return Array.from(map.values());
}
