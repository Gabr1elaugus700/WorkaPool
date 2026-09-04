import { PrismaClient } from "@prisma/client";
import { IUserRepository } from "./IUserRepository";
import {
  CreateUserPersistInput,
  ListUserRecord,
  ListUsersFilter,
  UpdateUserPersistInput,
  UserPublicRecord,
} from "../types/User.types";

const prisma = new PrismaClient();

const userPublicSelect = {
  id: true,
  user: true,
  role: true,
  name: true,
  codRep: true,
  mustChangePassword: true,
  isActive: true,
} as const;

function toUserPublicRecord(user: {
  id: string;
  user: string;
  role: UserPublicRecord["role"];
  name: string;
  codRep: number;
  mustChangePassword: boolean;
  isActive: boolean;
}): UserPublicRecord {
  return {
    id: user.id,
    user: user.user,
    role: user.role,
    name: user.name,
    codRep: user.codRep,
    mustChangePassword: user.mustChangePassword,
    isActive: user.isActive,
  };
}

export class PrismaUserRepository implements IUserRepository {
  async findByLogin(login: string): Promise<UserPublicRecord | null> {
    const user = await prisma.user.findUnique({
      where: { user: login },
      select: userPublicSelect,
    });

    return user ? toUserPublicRecord(user) : null;
  }

  async findById(id: string): Promise<UserPublicRecord | null> {
    const user = await prisma.user.findUnique({
      where: { id },
      select: userPublicSelect,
    });

    return user ? toUserPublicRecord(user) : null;
  }

  async list(filter?: ListUsersFilter): Promise<ListUserRecord[]> {
    const search = filter?.search?.trim();
    const users = await prisma.user.findMany({
      where: {
        ...(filter?.includeInactive ? {} : { isActive: true }),
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" as const } },
                { user: { contains: search, mode: "insensitive" as const } },
              ],
            }
          : {}),
      },
      select: {
        ...userPublicSelect,
        createdAt: true,
        departamentos: {
          include: {
            departamento: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return users.map((user) => ({
      ...toUserPublicRecord(user),
      createdAt: user.createdAt,
      departamentos: user.departamentos.map((link) => ({
        funcao: link.funcao,
        departamento: link.departamento,
      })),
    }));
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
      select: userPublicSelect,
    });

    return toUserPublicRecord(user);
  }

  async update(id: string, data: UpdateUserPersistInput): Promise<UserPublicRecord> {
    const user = await prisma.user.update({
      where: { id },
      data,
      select: userPublicSelect,
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
