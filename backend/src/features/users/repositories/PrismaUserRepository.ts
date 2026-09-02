import { PrismaClient } from "@prisma/client";
import { IUserRepository } from "./IUserRepository";
import {
  CreateUserPersistInput,
  UserPublicRecord,
} from "../types/User.types";

const prisma = new PrismaClient();

function toUserPublicRecord(user: {
  id: string;
  user: string;
  role: UserPublicRecord["role"];
  name: string;
  codRep: number;
  mustChangePassword: boolean;
}): UserPublicRecord {
  return {
    id: user.id,
    user: user.user,
    role: user.role,
    name: user.name,
    codRep: user.codRep,
    mustChangePassword: user.mustChangePassword,
  };
}

export class PrismaUserRepository implements IUserRepository {
  async findByLogin(login: string): Promise<UserPublicRecord | null> {
    const user = await prisma.user.findUnique({
      where: { user: login },
      select: {
        id: true,
        user: true,
        role: true,
        name: true,
        codRep: true,
        mustChangePassword: true,
      },
    });

    return user ? toUserPublicRecord(user) : null;
  }

  async create(input: CreateUserPersistInput): Promise<UserPublicRecord> {
    const user = await prisma.user.create({
      data: {
        user: input.user,
        password: input.passwordHash,
        role: input.role,
        name: input.name,
        codRep: input.codRep,
        mustChangePassword: input.mustChangePassword,
      },
      select: {
        id: true,
        user: true,
        role: true,
        name: true,
        codRep: true,
        mustChangePassword: true,
      },
    });

    return toUserPublicRecord(user);
  }

  async linkToDepartamento(
    userId: string,
    departamentoId: string,
    funcao: "GERENTE" | "FUNCIONARIO",
  ): Promise<void> {
    await prisma.usuarioDepartamento.create({
      data: {
        user_id: userId,
        departamento_id: departamentoId,
        funcao,
      },
    });
  }
}
