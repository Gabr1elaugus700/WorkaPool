import { Pedido } from '../entities/Pedido';
import { PedidoRaw } from '../entities/Pedido';

/**
 * Converte linhas brutas do SQL (uma por produto/derivação)
 * em entidades Pedido agregadas (um por número de pedido).
 */
export function mapRawToPedidos(rows: PedidoRaw[]): Pedido[] {
  const map = new Map<string, Pedido>();

  for (const row of rows) {
    const numPed = String(row.NUM_PED);

    if (!map.has(numPed)) {
      map.set(
        numPed,
        new Pedido({
          id: numPed,
          numPed,
          codCli: row.COD_CLI,
          cliente: row.CLIENTE,
          cidade: row.CIDADE,
          estado: row.ESTADO,
          vendedor: row.VENDEDOR,
          codRep: row.CODREP,
          bloqueado: row.BLOQUEADO,
          peso: row.PESO,
          codCar: row.CODCAR ?? null,
          poscar: row.POSCAR ?? null,
          sitcar: row.SITCAR ?? null,
          produtos: [],
        }),
      );
    }

    const pedido = map.get(numPed)!;
    pedido.produtos!.push({
      nome: row.PRODUTOS?.trim() || '',
      derivacao: row.DERIVACAO,
      quantidade: row.QUANTIDADE,
      peso: row.PESO,
    });
  }

  return Array.from(map.values());
}
