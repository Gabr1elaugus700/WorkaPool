import { Prisma } from "@prisma/client";
import prisma from "../../../config/prisma";
import { AppError } from "../../../utils/AppError";
import {
  CreateTruckInput,
  ListTrucksFilter,
  TruckRecord,
  UpdateTruckInput,
} from "../types/Truck.types";
import { ITrucksRepository } from "./ITrucksRepository";

function toTruckRecord(truck: {
  id: string;
  name: string;
  capacity: number;
  plate: string;
  type: string | null;
  axles: number | null;
  active: boolean;
  createdAt: Date;
  codRep: number;
}): TruckRecord {
  return {
    id: truck.id,
    name: truck.name,
    capacity: truck.capacity,
    plate: truck.plate,
    type: truck.type,
    axles: truck.axles,
    active: truck.active,
    createdAt: truck.createdAt,
    codRep: truck.codRep,
  };
}

function mapPrismaError(error: unknown): never {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    throw new AppError({
      message: "Já existe um caminhão com esta placa",
      statusCode: 409,
      code: "TRUCK_PLATE_CONFLICT",
      details: { target: error.meta?.target },
    });
  }

  throw error;
}

export class PrismaTrucksRepository implements ITrucksRepository {
  async create(input: CreateTruckInput): Promise<TruckRecord> {
    try {
      const truck = await prisma.trucks.create({
        data: {
          name: input.name,
          capacity: input.capacity,
          plate: input.plate.toUpperCase(),
          type: input.type ?? null,
          axles: input.axles ?? null,
          active: input.active ?? true,
          codRep: input.codRep ?? 0,
        },
      });
      return toTruckRecord(truck);
    } catch (error) {
      mapPrismaError(error);
    }
  }

  async findById(id: string): Promise<TruckRecord | null> {
    const truck = await prisma.trucks.findUnique({ where: { id } });
    return truck ? toTruckRecord(truck) : null;
  }

  async findByPlate(plate: string): Promise<TruckRecord | null> {
    const truck = await prisma.trucks.findUnique({
      where: { plate: plate.toUpperCase() },
    });
    return truck ? toTruckRecord(truck) : null;
  }

  async list(filter?: ListTrucksFilter): Promise<TruckRecord[]> {
    const trucks = await prisma.trucks.findMany({
      where:
        filter?.active === undefined ? undefined : { active: filter.active },
      orderBy: { name: "asc" },
    });
    return trucks.map(toTruckRecord);
  }

  async update(input: UpdateTruckInput): Promise<TruckRecord> {
    try {
      const truck = await prisma.trucks.update({
        where: { id: input.id },
        data: {
          name: input.name,
          capacity: input.capacity,
          plate: input.plate?.toUpperCase(),
          type: input.type,
          axles: input.axles,
          active: input.active,
        },
      });
      return toTruckRecord(truck);
    } catch (error) {
      mapPrismaError(error);
    }
  }

  async getFleetStats(): Promise<{ trucksOnTrip: number }> {
    const onTrip = await prisma.cargaDespacho.groupBy({
      by: ["caminhaoId"],
      where: {
        carga: {
          situacao: "FECHADA",
        },
      },
    });

    return { trucksOnTrip: onTrip.length };
  }
}
