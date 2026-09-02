import { Role } from "@prisma/client";
import { AppError } from "../../../utils/AppError";
import { IUserRepository } from "../repositories/IUserRepository";
import { PrismaUserRepository } from "../repositories/PrismaUserRepository";
import { UpdateUserInput, UserPublicRecord } from "../types/User.types";

export class UpdateUserUseCase {
  constructor(
    private readonly usersRepository: IUserRepository = new PrismaUserRepository(),
  ) {}

  async execute(input: UpdateUserInput): Promise<UserPublicRecord> {
    const target = await this.usersRepository.findById(input.targetUserId);
    if (!target) {
      throw new AppError({
        message: "Usuário não encontrado",
        statusCode: 404,
        code: "USER_NOT_FOUND",
      });
    }

    if (
      input.actorUserId === input.targetUserId &&
      target.role === Role.ADMIN &&
      input.role !== undefined &&
      input.role !== Role.ADMIN
    ) {
      throw new AppError({
        message: "Administrador não pode remover o próprio perfil ADMIN",
        statusCode: 422,
        code: "USER_SELF_DEMOTION_FORBIDDEN",
      });
    }

    return this.usersRepository.update(input.targetUserId, {
      name: input.name,
      role: input.role,
      codRep: input.codRep,
    });
  }
}
