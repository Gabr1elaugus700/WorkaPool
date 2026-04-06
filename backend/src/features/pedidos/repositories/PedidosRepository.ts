import { PrismaClient } from '@prisma/client';
import { sqlPool, sqlPoolConnect } from '../../../database/sqlServer';
import { Pedido, PedidoRaw } from '../../cargo/entities/Pedido';
import { mapRawToPedidos } from '../mappers/PedidoMapper';
import { HistoricoPesoPedido } from '../entities/HistoricoPesoPedido';
import { IPedidosRepository } from './IPedidosRepository';
import {
  QUERY_GET_PEDIDOS_BY_REP,
  QUERY_GET_PEDIDO_WEIGHT,
  QUERY_GET_PEDIDOS_BY_CARGA,
  QUERY_GET_PEDIDO_SITUACAO,
} from '../queries/pedidosQueries';

/**
 * Implementação do repositório de pedidos.
 * Acessa o ERP Sapiens (SQL Server) e banco local (Prisma).
 */
export class PedidosRepository implements IPedidosRepository {
  constructor(private prisma: PrismaClient = new PrismaClient()) {}

  async getPedidos(codRep?: number, codCar?: number): Promise<Pedido[]> {
    await sqlPoolConnect;

    const isAll = !codRep || codRep === 999;
    const request = sqlPool.request();

    if (!isAll) {
      request.input('codRep', codRep);
    }

    const query = QUERY_GET_PEDIDOS_BY_REP(isAll);
    const result = await request.query<PedidoRaw>(query);

    return mapRawToPedidos(result.recordset);
  }

  async getPedidosByCarga(codCar: number): Promise<Pedido[]> {
    await sqlPoolConnect;

    const result = await sqlPool
      .request()
      .input('codCar', codCar)
      .query<PedidoRaw>(QUERY_GET_PEDIDOS_BY_CARGA);

    return mapRawToPedidos(result.recordset);
  }

  async getPedidoWeight(
    numPed: number,
  ): Promise<{ numPed: number; peso: number }> {
    await sqlPoolConnect;

    const result = await sqlPool
      .request()
      .input('numPed', numPed)
      .query<PedidoRaw>(QUERY_GET_PEDIDO_WEIGHT);

    if (result.recordset.length === 0) {
      throw new Error(`Pedido ${numPed} não encontrado.`);
    }

    return {
      numPed: Number(result.recordset[0].NUM_PED),
      peso: Number(result.recordset[0].PESO),
    };
  }

  async getPedidoSituacaoSapiens(
    numPed: number,
  ): Promise<{ numPed: number; sitPed: number }> {
    await sqlPoolConnect;

    const result = await sqlPool
      .request()
      .input('numPed', numPed)
      .query(QUERY_GET_PEDIDO_SITUACAO);

    if (result.recordset.length === 0) {
      throw new Error(`Pedido ${numPed} não encontrado.`);
    }

    return {
      numPed: Number(result.recordset[0].NUM_PED),
      sitPed: Number(result.recordset[0].SIT_PED),
    };
  }

  async createHistoricoPeso(
    numPed: number,
    cargaId: string,
    peso: number,
  ): Promise<void> {
    console.log('💾 [PedidosRepository] Criando histórico de peso:', {
      numPed,
      cargaId,
      peso,
    });

    // Validar peso
    if (isNaN(peso) || peso === null || peso === undefined) {
      console.error('❌ [PedidosRepository] Peso inválido:', peso);
      throw new Error(`Peso inválido para o pedido ${numPed}: ${peso}`);
    }

    await this.prisma.historicoPesoPedidos.create({
      data: {
        numPed,
        peso: Math.round(peso), // Garantir que seja inteiro
        carga: {
          connect: { id: cargaId },
        },
      },
    });

    console.log('✅ [PedidosRepository] Histórico de peso criado com sucesso');
  }

  async getLastHistoricoPeso(
    numPed: number,
  ): Promise<HistoricoPesoPedido | null> {
    const result = await this.prisma.historicoPesoPedidos.findFirst({
      where: { numPed },
      orderBy: { createdAt: 'desc' },
      include: { carga: true },
    });

    if (!result) {
      return null;
    }

    return new HistoricoPesoPedido(
      result.numPed,
      result.peso,
      result.carga.codCar,
      result.createdAt,
    );
  }
}
