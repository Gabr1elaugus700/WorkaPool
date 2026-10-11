import { Request } from "express";
import { Role } from "@prisma/client";
import { AppError } from "../../../../utils/AppError";

export function actor(req: Request): { actorRole: Role; actorId: string } {
  if (!req.user) {
    throw new AppError({ message: "Usuário não autenticado", statusCode: 401, code: "IBC_ACTOR_REQUIRED" });
  }
  return { actorRole: req.user.role, actorId: req.user.id };
}

export function invalidBody(code: string, details: unknown): AppError {
  return new AppError({ message: "Dados inválidos", statusCode: 400, code, details });
}
