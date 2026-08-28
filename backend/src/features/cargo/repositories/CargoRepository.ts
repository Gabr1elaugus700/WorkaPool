import { PrismaClient, Role } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { Carga, SituacaoCarga } from "../entities/Carga";
import { Pedido } from "../entities/Pedido";
import { ICargoRepository } from "./ICargoRepository";
import { IPedidosRepository } from "../../pedidos/repositories/IPedidosRepository";
import prismaInstance from "../../../config/prisma";

import { sqlPool, sqlPoolConnect } from "../../../database/sqlServer";
import { AppError } from "../../../utils/AppError";
import {
  CargaDespachoRecord,
  CargoTruckRef,
  CargoUserRef,
  CloseCargaDespachoInput,
} from "../types/CargaDespacho.types";

export class CargoRepository implements ICargoRepository {
  constructor(
    private pedidosRepository?: IPedidosRepository,
    private prisma: PrismaClient = prismaInstance
  ) {}

  async createCarga(carga: Carga): Promise<Carga> {
    await this.prisma.cargas.create({
      data: {
        id: carga.id,
        codCar: carga.codCar,
        destino: carga.destino,
        previsaoSaida: carga.previsaoSaida,
        createdAt: carga.createdAt,
        closedAt: carga.closedAt,
        situacao: carga.situacao,
        pesoMax: carga.pesoMaximo,
        custoMin: 0,
      },
    });
    return carga;
  }

  async getCargaById(id: string): Promise<Carga | null> {
    const carga = await this.prisma.cargas.findUnique({
      where: { id },
    });
    if (!carga) {
      return null;
    }
    return new Carga({
      id: carga.id,
      codCar: carga.codCar,
      destino: carga.destino,
      previsaoSaida: carga.previsaoSaida,
      createdAt: carga.createdAt,
      closedAt: carga.closedAt || undefined,
      situacao: carga.situacao as SituacaoCarga,
      pesoMaximo: carga.pesoMax,
    });
  }

  async updateCarga(id: string, carga: Carga): Promise<Carga> {
    await this.prisma.cargas.update({
      where: { id: id },
      data: {
        codCar: carga.codCar,
        destino: carga.destino,
        previsaoSaida: carga.previsaoSaida,
        createdAt: carga.createdAt,
        closedAt: carga.closedAt,
        situacao: carga.situacao,
        pesoMax: carga.pesoMaximo,
      },
    });
    return carga;
  }

  async closeCarga(
    input: CloseCargaDespachoInput,
  ): Promise<{ carga: Carga; pedidosSalvos: number; despacho: CargaDespachoRecord }> {
    const { codCar, motoristaId, caminhaoId, fechadoPorId } = input;
    console.log(`🔵 [Repository] Iniciando fechamento da carga ${codCar}`);

    const carga = await this.getCargaByCodCar(codCar);
    if (!carga) {
      throw new AppError({
        message: `Carga ${codCar} não encontrada`,
        statusCode: 404,
        code: "CARGO_NOT_FOUND",
        details: { codCar },
      });
    }

    if (carga.situacao === SituacaoCarga.FECHADA) {
      throw new AppError({
        message: `Carga ${codCar} já está fechada`,
        statusCode: 409,
        code: "CARGO_JA_FECHADA",
        details: { codCar },
      });
    }

    const despachoExistente = await this.findDespachoByCargaId(carga.id);
    if (despachoExistente) {
      throw new AppError({
        message: `Carga ${codCar} já possui CargaDespacho`,
        statusCode: 409,
        code: "CARGO_JA_FECHADA",
        details: { codCar, despachoId: despachoExistente.id },
      });
    }

    const pedidosReais = await this.getPedidosPorCarga(codCar);

    if (pedidosReais.length === 0) {
      throw new AppError({
        message: `Carga ${codCar} não possui pedidos para ser fechada`,
        statusCode: 409,
        code: "CARGO_SEM_PEDIDOS_VINCULADOS",
        details: { codCar },
      });
    }

    console.log(
      `📦 [Repository] Encontrados ${pedidosReais.length} pedidos na carga`,
    );

    const closedAt = new Date();
    const eventId = randomUUID();
    const pedidosJson = pedidosReais.map((pedido) => ({
      numPed: pedido.numPed,
      codCli: pedido.codCli,
      cliente: pedido.cliente,
      cidade: pedido.cidade,
      estado: pedido.estado,
      vendedor: pedido.vendedor,
      codRep: pedido.codRep,
      peso: pedido.peso,
      bloqueado: pedido.bloqueado,
      produtos: pedido.produtos || [],
    }));

    const despacho = await this.prisma.$transaction(async (tx) => {
      await tx.cargas.update({
        where: { codCar },
        data: {
          situacao: "FECHADA",
          closedAt,
        },
      });

      const createdDespacho = await tx.cargaDespacho.create({
        data: {
          cargaId: carga.id,
          motoristaId,
          caminhaoId,
          fechadoPorId,
          fechadoEm: closedAt,
        },
      });

      const cargaFechadaExistente = await tx.cargasFechadas.findFirst({
        where: { cargaId: carga.id },
      });

      if (cargaFechadaExistente) {
        await tx.cargasFechadas.update({
          where: { id: cargaFechadaExistente.id },
          data: {
            pedidos: pedidosJson,
            createdAt: closedAt,
          },
        });
      } else {
        await tx.cargasFechadas.create({
          data: {
            cargaId: carga.id,
            pedidos: pedidosJson,
          },
        });
      }

      await tx.outboxEvent.create({
        data: {
          id: eventId,
          eventType: "CARGA_FECHADA",
          aggregateType: "Cargas",
          aggregateId: carga.id,
          occurredAt: closedAt,
          payload: {
            cargaId: carga.id,
            codCar,
          },
        },
      });

      return createdDespacho;
    });

    console.log(`🎉 [Repository] Carga ${codCar} fechada com sucesso`);

    return {
      carga: {
        ...carga,
        situacao: SituacaoCarga.FECHADA,
        closedAt,
      },
      pedidosSalvos: pedidosReais.length,
      despacho: {
        id: despacho.id,
        cargaId: despacho.cargaId,
        motoristaId: despacho.motoristaId,
        caminhaoId: despacho.caminhaoId,
        fechadoPorId: despacho.fechadoPorId,
        fechadoEm: despacho.fechadoEm,
      },
    };
  }

  async findUserById(id: string): Promise<CargoUserRef | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true, name: true },
    });
    if (!user) {
      return null;
    }
    return { id: user.id, role: user.role, name: user.name };
  }

  async findTruckById(id: string): Promise<CargoTruckRef | null> {
    const truck = await this.prisma.trucks.findUnique({
      where: { id },
      select: { id: true, name: true },
    });
    if (!truck) {
      return null;
    }
    return { id: truck.id, name: truck.name };
  }

  async findDespachoByCargaId(
    cargaId: string,
  ): Promise<CargaDespachoRecord | null> {
    const despacho = await this.prisma.cargaDespacho.findUnique({
      where: { cargaId },
    });
    if (!despacho) {
      return null;
    }
    return {
      id: despacho.id,
      cargaId: despacho.cargaId,
      motoristaId: despacho.motoristaId,
      caminhaoId: despacho.caminhaoId,
      fechadoPorId: despacho.fechadoPorId,
      fechadoEm: despacho.fechadoEm,
    };
  }

  async listMotoristas(): Promise<CargoUserRef[]> {
    const users = await this.prisma.user.findMany({
      where: { role: Role.MOTORISTA },
      select: { id: true, role: true, name: true },
      orderBy: { name: "asc" },
    });
    return users.map((user) => ({
      id: user.id,
      role: user.role,
      name: user.name,
    }));
  }

  async listTrucks(): Promise<CargoTruckRef[]> {
    const trucks = await this.prisma.trucks.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
    return trucks.map((truck) => ({ id: truck.id, name: truck.name }));
  }

  async deleteCarga(id: string): Promise<void> {
    await this.prisma.cargas.delete({
      where: { id },
    });
  }

  async getPedidosPorCarga(codCar: number): Promise<Pedido[]> {
    // Delega para o repositório de pedidos
    console.log(`🔵 [Repository] Buscando pedidos para carga ${codCar}`);
    if (!this.pedidosRepository) {
      throw new AppError({
        message: "Repositório de pedidos não inicializado",
        statusCode: 500,
        code: "CARGO_REPOSITORY_NOT_INITIALIZED",
        details: { method: "getPedidosPorCarga" },
        isOperational: false,
      });
    } 

    return await this.pedidosRepository.getPedidosByCarga(codCar);
  }

  async getMaxCodCar(): Promise<number> {
    const result = await this.prisma.cargas.findFirst({
      orderBy: { codCar: "desc" },
    });
    return result ? result.codCar : 0;
  }

  async getCargas(situacao?: SituacaoCarga): Promise<Carga[]> {
    const cargas = await this.prisma.cargas.findMany({
      where: situacao ? { situacao } : undefined,
    });
    return cargas.map(
      (carga) =>
        new Carga({
          id: carga.id,
          codCar: carga.codCar,
          destino: carga.destino,
          previsaoSaida: carga.previsaoSaida,
          createdAt: carga.createdAt,
          closedAt: carga.closedAt || undefined,
          situacao: carga.situacao as SituacaoCarga,
          pesoMaximo: carga.pesoMax,
        }),
    );
  }

  async updatePedidoCarga(
    numPed: number,
    codCar: number,
    posCar: number,
  ): Promise<void> {
    console.log("🔵 [Repository] updatePedidoCarga recebeu:", {
      numPed,
      codCar,
      posCar,
    });

    await sqlPoolConnect;
    const result = await sqlPool
      .request()
      .input("codCar", codCar)
      .input("posCar", posCar)
      .input("numPed", numPed).query(`
            UPDATE e120ped 
            SET usu_codcar=@codCar 
               ,usu_poscar =@posCar
            WHERE numped =@numPed
        `);

    console.log("🔵 [Repository] Resultado da query:", {
      rowsAffected: result.rowsAffected[0],
      numPed,
      codCar,
      posCar,
    });

    if (result.rowsAffected[0] === 0) {
      throw new AppError({
        message: `Pedido ${numPed} não encontrado ou não pôde ser atualizado.`,
        statusCode: 404,
        code: "CARGO_PEDIDO_NOT_FOUND_OR_NOT_UPDATED",
        details: { numPed, codCar, posCar },
      });
    } else {
      console.log(
        `✅ [Repository] Pedido ${numPed} atualizado com sucesso para carga ${codCar} na posição ${posCar}.`,
      );
    }
  }

  async updateSituacaoCarga(
    codCar: number,
    situacao: SituacaoCarga,
  ): Promise<Carga> {
    const carga = await this.prisma.cargas.update({
      where: { codCar },
      data: { situacao },
    });

    return new Carga({
      id: carga.id,
      codCar: carga.codCar,
      destino: carga.destino,
      previsaoSaida: carga.previsaoSaida,
      createdAt: carga.createdAt,
      closedAt: carga.closedAt || undefined,
      situacao: carga.situacao as SituacaoCarga,
      pesoMaximo: carga.pesoMax,
    });
  }

  async getCargaByCodCar(codCar: number): Promise<Carga | null> {
    const carga = await this.prisma.cargas.findUnique({
      where: { codCar },
    });

    if (!carga) {
      return null;
    }

    return {
      id: carga.id,
      codCar: carga.codCar,
      destino: carga.destino,
      pesoMaximo: carga.pesoMax,
      previsaoSaida: carga.previsaoSaida,
      situacao: carga.situacao as SituacaoCarga,
      createdAt: carga.createdAt,
    };
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
    console.log(`🔵 [Repository] Buscando cargas fechadas`);

    const cargasFechadas = await this.prisma.cargasFechadas.findMany({
      include: {
        carga: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    console.log(
      `📦 [Repository] Encontradas ${cargasFechadas.length} cargas fechadas`,
    );

    return cargasFechadas.map((cf) => ({
      id: cf.id,
      cargaId: cf.cargaId,
      createdAt: cf.createdAt,
      carga: {
        id: cf.carga.id,
        codCar: cf.carga.codCar,
        destino: cf.carga.destino,
        pesoMaximo: cf.carga.pesoMax,
        situacao: cf.carga.situacao,
        previsaoSaida: cf.carga.previsaoSaida,
        closedAt: cf.carga.closedAt,
      },
      pedidos: cf.pedidos,
    }));
  }
  async validarCargaSapiens(numPed: number): Promise<boolean> {
    await sqlPoolConnect;
    const result = await sqlPool
      .request()
      .input("numPed", numPed)
      .query(`
        SELECT pes.numane, pes.numped FROM e135pes pes WHERE pes.numped = @numPed
      `);
    if (result.recordset.length === 0) {
      return false;
    } else {
      return true;
    }
  }
}
