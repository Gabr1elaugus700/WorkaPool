import { PrismaClient } from "@prisma/client";
import { Carga } from "../entities/Carga";
import { Pedido } from "../entities/Pedido";
import { ICargoRepository } from "./ICargoRepository";

import { sqlPool } from "../../../database/sqlServer";

export class CargoRepository implements ICargoRepository {
  constructor(private prisma: PrismaClient = new PrismaClient()) {}

    async createCarga(carga: Carga): Promise<void> {
        await this.prisma.cargas.create({
            data: {
                codCar: carga.codCar,
                destino: carga.destino,
                previsaoSaida: carga.previsaoSaida,
                createdAt: carga.createdAt,
                closedAt: carga.closedAt,
                situacao: carga.situacao
            }
        });
    }
}