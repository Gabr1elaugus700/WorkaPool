import bcrypt from "bcrypt";
import { AppError } from "../../../utils/AppError";
import { IUserRepository } from "../repositories/IUserRepository";
import { PrismaUserRepository } from "../repositories/PrismaUserRepository";
import { AdminResetPasswordInput, UserPublicRecord } from "../types/User.types";

export class AdminResetPasswordUseCase {
  constructor(
    private readonly usersRepository: IUserRepository = new PrismaUserRepository(),
  ) {}

  async execute(input: AdminResetPasswordInput): Promise<UserPublicRecord> {
    const target = await this.usersRepository.findById(input.targetUserId);
    if (!target) {
      throw new AppError({
        message: "Usuário não encontrado",
        statusCode: 404,
        code: "USER_NOT_FOUND",
      });
    }

    const passwordHash = await bcrypt.hash(input.newPassword, 10);
    const updateData: { password: string; mustChangePassword?: boolean } = {
      password: passwordHash,
    };

    if (input.mustChangePassword !== undefined) {
      updateData.mustChangePassword = input.mustChangePassword;
    }

    return this.usersRepository.update(input.targetUserId, updateData);
  }
}
