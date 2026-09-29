import type { Request, Response } from "express";
import {
  createOverviewCustomerObservationBodySchema,
  listOverviewCustomerObservationsQuerySchema,
  updateOverviewCustomerObservationBodySchema,
} from "../../schemas/overviewCustomerObservation.schemas";
import type { CreateOverviewCustomerObservationUseCase } from "../../useCases/CreateOverviewCustomerObservationUseCase";
import type { ListOverviewCustomerObservationsUseCase } from "../../useCases/ListOverviewCustomerObservationsUseCase";
import type { UpdateOverviewCustomerObservationUseCase } from "../../useCases/UpdateOverviewCustomerObservationUseCase";
import {
  parseOverviewCustomerCode,
  sendInvalidOverviewCustomerId,
  sendOverviewCustomerError,
} from "../overviewCustomerHttpResponses";

export type OverviewCustomerObservationControllerDeps = {
  listObservations: ListOverviewCustomerObservationsUseCase;
  createObservation: CreateOverviewCustomerObservationUseCase;
  updateObservation: UpdateOverviewCustomerObservationUseCase;
};

export class OverviewCustomerObservationController {
  constructor(private readonly deps: OverviewCustomerObservationControllerDeps) {}

  list = async (req: Request, res: Response): Promise<Response> => {
    try {
      const customerCode = parseOverviewCustomerCode(req.params.clienteId);
      if (customerCode === null) {
        return sendInvalidOverviewCustomerId(res);
      }

      const user = req.user;
      if (!user) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      const query = listOverviewCustomerObservationsQuerySchema.safeParse(req.query);
      if (!query.success) {
        return res.status(400).json({
          error: "Cursor de paginação inválido",
          code: "OBSERVATION_INVALID_CURSOR",
          details: query.error.format(),
        });
      }

      const { beforeCreatedAt, beforeId } = query.data;
      const result = await this.deps.listObservations.execute({
        customerCode,
        role: user.role,
        codRep: user.codRep,
        before:
          beforeCreatedAt && beforeId
            ? { createdAt: beforeCreatedAt, id: beforeId }
            : undefined,
      });

      return res.status(200).json(result);
    } catch (error: unknown) {
      return sendOverviewCustomerError(res, error, "Erro ao buscar observações do cliente");
    }
  };

  create = async (req: Request, res: Response): Promise<Response> => {
    try {
      const customerCode = parseOverviewCustomerCode(req.params.clienteId);
      if (customerCode === null) {
        return sendInvalidOverviewCustomerId(res);
      }

      const user = req.user;
      if (!user) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      const payload = createOverviewCustomerObservationBodySchema.safeParse(req.body);
      if (!payload.success) {
        return res.status(400).json({
          error: "Corpo da observação inválido",
          code: "OBSERVATION_INVALID_BODY",
          details: payload.error.format(),
        });
      }

      const result = await this.deps.createObservation.execute({
        customerCode,
        role: user.role,
        codRep: user.codRep,
        authorUserId: user.id,
        body: payload.data.body,
      });

      return res.status(201).json(result);
    } catch (error: unknown) {
      return sendOverviewCustomerError(res, error, "Erro ao registrar observação do cliente");
    }
  };

  update = async (req: Request, res: Response): Promise<Response> => {
    try {
      const customerCode = parseOverviewCustomerCode(req.params.clienteId);
      if (customerCode === null) {
        return sendInvalidOverviewCustomerId(res);
      }

      const user = req.user;
      if (!user) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      const observationId = req.params.observationId?.trim() ?? "";
      if (observationId.length === 0) {
        return res.status(404).json({
          error: "Observação não encontrada",
          code: "OBSERVATION_NOT_FOUND",
        });
      }

      const payload = updateOverviewCustomerObservationBodySchema.safeParse(req.body);
      if (!payload.success) {
        return res.status(400).json({
          error: "Corpo da observação inválido",
          code: "OBSERVATION_INVALID_BODY",
          details: payload.error.format(),
        });
      }

      const result = await this.deps.updateObservation.execute({
        customerCode,
        role: user.role,
        codRep: user.codRep,
        observationId,
        requesterUserId: user.id,
        body: payload.data.body,
      });

      return res.status(200).json(result);
    } catch (error: unknown) {
      return sendOverviewCustomerError(res, error, "Erro ao editar observação do cliente");
    }
  };
}
