import { PrismaClient } from "@prisma/client";
import { Carga, SituacaoCarga } from "../entities/Carga";
import { Pedido, PedidoRaw } from "../entities/Pedido";
import { ICargoRepository } from "./ICargoRepository";
import { IPedidosRepository } from "../../pedidos/repositories/IPedidosRepository";
import prismaInstance from "../../../config/prisma";

import { sqlPool, sqlPoolConnect } from "../../../database/sqlServer";

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
    codCar: number,
  ): Promise<{ carga: Carga; pedidosSalvos: number }> {
    console.log(`🔵 [Repository] Iniciando fechamento da carga ${codCar}`);

    // 1. Buscar a carga
    const carga = await this.getCargaByCodCar(codCar);
    if (!carga) {
      throw new Error(`Carga ${codCar} não encontrada`);
    }

    // 2. Buscar TODOS os pedidos REAIS dessa carga do SQL Server
    const pedidosReais = await this.getPedidosPorCarga(codCar);

    if (pedidosReais.length === 0) {
      throw new Error(`Carga ${codCar} não possui pedidos para ser fechada`);
    }

    console.log(
      `📦 [Repository] Encontrados ${pedidosReais.length} pedidos na carga`,
    );

    // 3. Atualizar situação da carga para FECHADA
    await this.prisma.cargas.update({
      where: { codCar },
      data: {
        situacao: "FECHADA",
        closedAt: new Date(),
      },
    });

    // 4. Verificar se já existe registro de carga fechada (upsert)
    const cargaFechadaExistente = await this.prisma.cargasFechadas.findFirst({
      where: { cargaId: carga.id },
    });

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

    if (cargaFechadaExistente) {
      // Atualizar registro existente
      await this.prisma.cargasFechadas.update({
        where: { id: cargaFechadaExistente.id },
        data: {
          pedidos: pedidosJson,
          createdAt: new Date(), // Atualizar timestamp
        },
      });
      console.log(`✅ [Repository] Registro de carga fechada atualizado`);
    } else {
      // Criar novo registro
      await this.prisma.cargasFechadas.create({
        data: {
          cargaId: carga.id,
          pedidos: pedidosJson,
        },
      });
      console.log(`✅ [Repository] Novo registro de carga fechada criado`);
    }

    console.log(`🎉 [Repository] Carga ${codCar} fechada com sucesso`);

    return {
      carga: {
        ...carga,
        situacao: "FECHADA" as SituacaoCarga,
        closedAt: new Date(),
      },
      pedidosSalvos: pedidosReais.length,
    };
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
      throw new Error("Repositório de pedidos não inicializado");
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
      throw new Error(
        `Pedido ${numPed} não encontrado ou não pôde ser atualizado.`,
      );
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
  async getCargasFechadas(): Promise<any[]> {
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
}
