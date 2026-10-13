import { Request, Response } from "express";
import { AppError } from "../../../../utils/AppError";
import { respondAppError } from "./IbcController";
import type { AvisoLeituraPort } from "../../repositories/AvisoRepresentanteRepository";
import { ListAvisosRepresentanteUseCase } from "../../useCases/ListAvisosRepresentante.use-case";
import { MarcarAvisoRepresentanteLidoUseCase } from "../../useCases/MarcarAvisoRepresentanteLido.use-case";

export class IbcAvisoController {
  constructor(private readonly avisos: AvisoLeituraPort) {}

  listar = async (req: Request, res: Response): Promise<Response> => {
    try {
      return res.status(200).json(await new ListAvisosRepresentanteUseCase(this.avisos).execute(leitor(req)));
    } catch (err: unknown) {
      return respondAppError(res, err, "Erro ao listar avisos do representante");
    }
  };

  marcarLido = async (req: Request, res: Response): Promise<Response> => {
    try {
      const aviso = await new MarcarAvisoRepresentanteLidoUseCase(this.avisos).execute({
        id: req.params.id,
        ...leitor(req),
      });
      return res.status(200).json(aviso);
    } catch (err: unknown) {
      return respondAppError(res, err, "Erro ao marcar aviso como lido");
    }
  };
}

function leitor(req: Request) {
  if (!req.user) {
    throw new AppError({ message: "Usuário não autenticado", statusCode: 401, code: "IBC_ACTOR_REQUIRED" });
  }
  return { role: req.user.role, codRep: req.user.codRep };
}
