import { Request, Response } from "express";
import { AppError } from "../../../../utils/AppError";
import { CreateTruckUseCase } from "../../useCases/CreateTruckUseCase";
import { GetTruckByIdUseCase } from "../../useCases/GetTruckByIdUseCase";
import { ListTrucksUseCase } from "../../useCases/ListTrucksUseCase";
import { UpdateTruckUseCase } from "../../useCases/UpdateTruckUseCase";
import { TruckRecord } from "../../types/Truck.types";

function toTruckResponse(truck: TruckRecord) {
  return {
    id: truck.id,
    name: truck.name,
    capacity: truck.capacity,
    plate: truck.plate,
    type: truck.type,
    axles: truck.axles,
    active: truck.active,
    createdAt: truck.createdAt.toISOString(),
    codRep: truck.codRep,
  };
}

function handleError(err: unknown, res: Response): Response {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
      details: err.details,
    });
  }

  const message = err instanceof Error ? err.message : "Erro interno";
  return res.status(500).json({ error: message, code: "INTERNAL_ERROR" });
}

export class TrucksController {
  static async list(req: Request, res: Response): Promise<Response> {
    try {
      const active =
        req.query.active === "true"
          ? true
          : req.query.active === "false"
            ? false
            : undefined;
      const useCase = new ListTrucksUseCase();
      const trucks = await useCase.execute({ active });
      return res.status(200).json(trucks.map(toTruckResponse));
    } catch (err) {
      return handleError(err, res);
    }
  }

  static async getById(req: Request, res: Response): Promise<Response> {
    try {
      const useCase = new GetTruckByIdUseCase();
      const truck = await useCase.execute(String(req.params.id));
      return res.status(200).json(toTruckResponse(truck));
    } catch (err) {
      return handleError(err, res);
    }
  }

  static async create(req: Request, res: Response): Promise<Response> {
    try {
      const useCase = new CreateTruckUseCase();
      const truck = await useCase.execute(req.body);
      return res.status(201).json(toTruckResponse(truck));
    } catch (err) {
      return handleError(err, res);
    }
  }

  static async update(req: Request, res: Response): Promise<Response> {
    try {
      const useCase = new UpdateTruckUseCase();
      const truck = await useCase.execute({
        id: String(req.params.id),
        ...req.body,
      });
      return res.status(200).json(toTruckResponse(truck));
    } catch (err) {
      return handleError(err, res);
    }
  }
}
