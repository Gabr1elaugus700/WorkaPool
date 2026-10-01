import { AppError } from "../../../utils/AppError";
import { IUserRepository } from "../repositories/IUserRepository";
import { PrismaUserRepository } from "../repositories/PrismaUserRepository";
import { SetUserActiveInput, UserPublicRecord } from "../types/User.types";

export class SetUserActiveUseCase {
  constructor(
    private readonly usersRepository: IUserRepository = new PrismaUserRepository(),
  ) {}

  async execute(input: SetUserActiveInput): Promise<UserPublicRecord> {
    const target = await this.usersRepository.findById(input.targetUserId);
    if (!target) {
      throw new AppError({
        message: "Usuário não encontrado",
        statusCode: 404,
        code: "USER_NOT_FOUND",
      });
    }

    return this.usersRepository.update(input.targetUserId, {
      isActive: input.isActive,
    });
  }
}
