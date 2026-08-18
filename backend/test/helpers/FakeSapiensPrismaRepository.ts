import { HistoricoPesoPedido } from '../../src/features/pedidos/entities/HistoricoPesoPedido';
import { IPedidosRepository } from '../../src/features/pedidos/repositories/IPedidosRepository';
import { PedidoCargo } from '../../src/features/pedidos/types/PedidoCargo.types';
import { FakeSapiens } from './FakeSapiens';

type HistoricoPesoRepository = Pick<
  IPedidosRepository,
  'createHistoricoPeso' | 'getLastHistoricoPeso'
>;

export class FakeSapiensPrismaRepository implements IPedidosRepository {
  constructor(
    private readonly fakeSapiens: FakeSapiens,
    private readonly historicoRepository: HistoricoPesoRepository,
  ) {}

  getPedidos(codRep?: number, codCar?: number): Promise<PedidoCargo[]> {
    return this.fakeSapiens.getPedidos(codRep, codCar);
  }

  getPedidosByCarga(codCar: number): Promise<PedidoCargo[]> {
    return this.fakeSapiens.getPedidosByCarga(codCar);
  }

  getPedidoWeight(
    numPed: number,
  ): Promise<{ numPed: number; peso: number }> {
    return this.fakeSapiens.getPedidoWeight(numPed);
  }

  getPedidoSituacaoSapiens(
    numPed: number,
  ): Promise<{ numPed: number; sitPed: number }> {
    return this.fakeSapiens.getPedidoSituacaoSapiens(numPed);
  }

  createHistoricoPeso(
    numPed: number,
    cargaId: string,
    peso: number,
  ): Promise<void> {
    return this.historicoRepository.createHistoricoPeso(
      numPed,
      cargaId,
      peso,
    );
  }

  getLastHistoricoPeso(
    numPed: number,
  ): Promise<HistoricoPesoPedido | null> {
    return this.historicoRepository.getLastHistoricoPeso(numPed);
  }
}
