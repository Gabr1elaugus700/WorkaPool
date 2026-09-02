import bcrypt from "bcrypt";
import { Role } from "@prisma/client";
import { AppError } from "../../../utils/AppError";
import { IUserRepository } from "../repositories/IUserRepository";
import { PrismaUserRepository } from "../repositories/PrismaUserRepository";
import { CreateUserInput, UserPublicRecord } from "../types/User.types";

const ROLES_REQUIRING_DEPARTMENT: Role[] = [Role.GERENTE_DPTO, Role.ALMOX];

export class CreateUserUseCase {
  constructor(
    private readonly usersRepository: IUserRepository = new PrismaUserRepository(),
  ) {}

  async execute(input: CreateUserInput): Promise<UserPublicRecord> {
    if (input.role === Role.VENDAS && (input.codRep === undefined || input.codRep <= 0)) {
      throw new AppError({
        message: "codRep é obrigatório para usuários com role VENDAS",
        statusCode: 422,
        code: "USER_CODREP_REQUIRED",
      });
    }

    if (ROLES_REQUIRING_DEPARTMENT.includes(input.role) && !input.departamentoId) {
      throw new AppError({
        message: "Departamento é obrigatório para esta role",
        statusCode: 422,
        code: "USER_DEPARTMENT_REQUIRED",
      });
    }

    const existing = await this.usersRepository.findByLogin(input.user);
    if (existing) {
      throw new AppError({
        message: "Usuário já existe, verifique.",
        statusCode: 409,
        code: "USER_ALREADY_EXISTS",
      });
    }

    const passwordHash = await bcrypt.hash(input.password, 10);
    const created = await this.usersRepository.create({
      user: input.user,
      passwordHash,
      role: input.role,
      name: input.name,
      codRep: input.codRep ?? 0,
      mustChangePassword: true,
    });

    if (input.departamentoId) {
      const funcao = input.role === Role.GERENTE_DPTO ? "GERENTE" : "FUNCIONARIO";
      await this.usersRepository.linkToDepartamento(
        created.id,
        input.departamentoId,
        funcao,
      );
    }

    return created;
  }
}
