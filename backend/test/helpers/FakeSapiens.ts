import { Role } from '@prisma/client';
import { Carga, SituacaoCarga } from '../../src/features/cargo/entities/Carga';
import { Pedido } from '../../src/features/cargo/entities/Pedido';
import { ICargoRepository } from '../../src/features/cargo/repositories/ICargoRepository';
import {
  CargaDespachoRecord,
  CargoTruckRef,
  CargoUserRef,
  CloseCargaDespachoInput,
} from '../../src/features/cargo/types/CargaDespacho.types';
import { HistoricoPesoPedido } from '../../src/features/pedidos/entities/HistoricoPesoPedido';
import { mapRawToPedidos } from '../../src/features/pedidos/mappers/PedidoMapper';
import { IPedidosRepository } from '../../src/features/pedidos/repositories/IPedidosRepository';
import { PedidoCargo } from '../../src/features/pedidos/types/PedidoCargo.types';
import { PedidoRaw } from '../../src/features/pedidos/types/PedidoRaw';

interface FakeSapiensSeed {
  cargas: Carga[];
  rows: PedidoRaw[];
  historicos?: HistoricoPesoPedido[];
  users?: CargoUserRef[];
  trucks?: CargoTruckRef[];
  despachos?: CargaDespachoRecord[];
}

interface FakeSapiensWriteCounts {
  historicosCriados: number;
  pedidosCargaAtualizados: number;
  cargasAtualizadas: number;
}

export class FakeSapiens implements ICargoRepository, IPedidosRepository {
  private readonly cargas: Carga[];
  private readonly rows: PedidoRaw[];
  private readonly historicos: HistoricoPesoPedido[];
  private readonly users: CargoUserRef[];
  private readonly trucks: CargoTruckRef[];
  private readonly despachos: CargaDespachoRecord[];
  private readonly writeCounts: FakeSapiensWriteCounts = {
    historicosCriados: 0,
    pedidosCargaAtualizados: 0,
    cargasAtualizadas: 0,
  };

  constructor(seed: FakeSapiensSeed) {
    this.cargas = [...seed.cargas];
    this.rows = seed.rows.map((row) => ({ ...row }));
    this.historicos = [...(seed.historicos ?? [])];
    this.users = [...(seed.users ?? [])];
    this.trucks = [...(seed.trucks ?? [])];
    this.despachos = [...(seed.despachos ?? [])];
  }

  async getPedidos(codRep?: number, codCar?: number): Promise<PedidoCargo[]> {
    const rows = this.rows.filter(
      (row) =>
        (codRep == null || codRep === 999 || row.CODREP === codRep) &&
        (codCar == null || row.CODCAR === codCar),
    );

    return mapRawToPedidos(rows);
  }

  async getPedidosByCarga(codCar: number): Promise<PedidoCargo[]> {
    return mapRawToPedidos(this.rows.filter((row) => row.CODCAR === codCar));
  }

  async getPedidoWeight(
    numPed: number,
  ): Promise<{ numPed: number; peso: number }> {
    const [pedido] = mapRawToPedidos(
      this.rows.filter((row) => Number(row.NUM_PED) === numPed),
    );

    if (!pedido) {
      throw new Error(`Pedido ${numPed} não encontrado no FakeSapiens`);
    }

    return { numPed, peso: pedido.peso };
  }

  async getPedidoSituacaoSapiens(
    numPed: number,
  ): Promise<{ numPed: number; sitPed: number }> {
    const pedidoExiste = this.rows.some(
      (row) => Number(row.NUM_PED) === numPed,
    );

    if (!pedidoExiste) {
      throw new Error(`Pedido ${numPed} não encontrado no FakeSapiens`);
    }

    return { numPed, sitPed: 1 };
  }

  async createHistoricoPeso(
    numPed: number,
    cargaId: string,
    peso: number,
  ): Promise<void> {
    const carga = this.cargas.find((item) => item.id === cargaId);

    if (!carga) {
      throw new Error(`Carga ${cargaId} não encontrada no FakeSapiens`);
    }

    this.writeCounts.historicosCriados += 1;
    this.historicos.push(
      new HistoricoPesoPedido(numPed, peso, carga.codCar, new Date()),
    );
  }

  async getLastHistoricoPeso(
    numPed: number,
  ): Promise<HistoricoPesoPedido | null> {
    return (
      [...this.historicos]
        .reverse()
        .find((historico) => historico.numPed === numPed) ?? null
    );
  }

  async createCarga(carga: Carga): Promise<Carga> {
    this.cargas.push(carga);
    return carga;
  }

  async getCargaById(id: string): Promise<Carga | null> {
    return this.cargas.find((carga) => carga.id === id) ?? null;
  }

  async updateCarga(id: string, carga: Carga): Promise<Carga> {
    const index = this.cargas.findIndex((item) => item.id === id);

    if (index < 0) {
      throw new Error(`Carga ${id} não encontrada no FakeSapiens`);
    }

    this.writeCounts.cargasAtualizadas += 1;
    this.cargas[index] = carga;
    return carga;
  }

  async closeCarga(
    input: CloseCargaDespachoInput,
  ): Promise<{ carga: Carga; pedidosSalvos: number; despacho: CargaDespachoRecord }> {
    const carga = await this.updateSituacaoCarga(
      input.codCar,
      SituacaoCarga.FECHADA,
    );
    const pedidosSalvos = (await this.getPedidosByCarga(input.codCar)).length;
    const despacho: CargaDespachoRecord = {
      id: `despacho-${input.codCar}`,
      cargaId: carga.id,
      motoristaId: input.motoristaId,
      caminhaoId: input.caminhaoId,
      fechadoPorId: input.fechadoPorId,
      fechadoEm: new Date(),
    };
    this.despachos.push(despacho);

    return { carga, pedidosSalvos, despacho };
  }

  async findUserById(id: string): Promise<CargoUserRef | null> {
    return this.users.find((user) => user.id === id) ?? null;
  }

  async findTruckById(id: string): Promise<CargoTruckRef | null> {
    return this.trucks.find((truck) => truck.id === id) ?? null;
  }

  async findDespachoByCargaId(
    cargaId: string,
  ): Promise<CargaDespachoRecord | null> {
    return this.despachos.find((despacho) => despacho.cargaId === cargaId) ?? null;
  }

  async listMotoristas(): Promise<CargoUserRef[]> {
    return this.users.filter((user) => user.role === Role.MOTORISTA);
  }

  async listTrucks(): Promise<CargoTruckRef[]> {
    return [...this.trucks];
  }

  async deleteCarga(id: string): Promise<void> {
    const index = this.cargas.findIndex((carga) => carga.id === id);

    if (index >= 0) {
      this.cargas.splice(index, 1);
    }
  }

  async getPedidosPorCarga(codCar: number): Promise<Pedido[]> {
    return this.getPedidosByCarga(codCar);
  }

  async updatePedidoCarga(
    numPed: number,
    codCar: number,
    posCar: number,
  ): Promise<void> {
    const pedidoRows = this.rows.filter(
      (row) => Number(row.NUM_PED) === numPed,
    );

    if (pedidoRows.length === 0) {
      throw new Error(`Pedido ${numPed} não encontrado no FakeSapiens`);
    }

    this.writeCounts.pedidosCargaAtualizados += 1;
    for (const row of pedidoRows) {
      row.CODCAR = codCar;
      row.POSCAR = posCar;
    }
  }

  async getCargas(situacao?: SituacaoCarga): Promise<Carga[]> {
    return this.cargas.filter(
      (carga) => situacao == null || carga.situacao === situacao,
    );
  }

  async getMaxCodCar(): Promise<number> {
    return Math.max(...this.cargas.map((carga) => carga.codCar), 0);
  }

  async updateSituacaoCarga(
    codCar: number,
    situacao: SituacaoCarga,
  ): Promise<Carga> {
    const carga = await this.getCargaByCodCar(codCar);

    if (!carga) {
      throw new Error(`Carga ${codCar} não encontrada no FakeSapiens`);
    }

    carga.situacao = situacao;
    return carga;
  }

  async getCargaByCodCar(codCar: number): Promise<Carga | null> {
    return this.cargas.find((carga) => carga.codCar === codCar) ?? null;
  }

  async getCargasFechadas(): Promise<
    Array<{
      id: string;
      cargaId: string;
      createdAt: Date;
      carga: {
        id: string;
        codCar: number;
        destino: string;
        pesoMaximo: number;
        situacao: string;
        previsaoSaida: Date;
        closedAt: Date | null;
      };
      pedidos: unknown;
    }>
  > {
    const fechadas = await this.getCargas(SituacaoCarga.FECHADA);
    return fechadas.map((carga) => ({
      id: `fechada-${carga.id}`,
      cargaId: carga.id,
      createdAt: carga.closedAt ?? new Date(),
      carga: {
        id: carga.id,
        codCar: carga.codCar,
        destino: carga.destino,
        pesoMaximo: carga.pesoMaximo,
        situacao: carga.situacao,
        previsaoSaida: carga.previsaoSaida,
        closedAt: carga.closedAt ?? null,
      },
      pedidos: [],
    }));
  }

  async validarCargaSapiens(numPed: number): Promise<boolean> {
    return this.rows.some((row) => Number(row.NUM_PED) === numPed);
  }

  updateItemWeight(numPed: number, derivacao: string, peso: number): void {
    const row = this.rows.find(
      (item) =>
        Number(item.NUM_PED) === numPed && item.DERIVACAO === derivacao,
    );

    if (!row) {
      throw new Error(
        `Item ${derivacao} do pedido ${numPed} não encontrado no FakeSapiens`,
      );
    }

    row.PESO = peso;
  }

  getHistoricos(): readonly HistoricoPesoPedido[] {
    return this.historicos;
  }

  getWriteCounts(): Readonly<FakeSapiensWriteCounts> {
    return { ...this.writeCounts };
  }
}
