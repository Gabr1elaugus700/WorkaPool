import { Role } from "@prisma/client";
import {
  CreateUserPersistInput,
  ListUserRecord,
  ListUsersFilter,
  UpdateUserPersistInput,
  UserPublicRecord,
} from "../types/User.types";

export interface IUserRepository {
  findByLogin(login: string): Promise<UserPublicRecord | null>;
  findById(id: string): Promise<UserPublicRecord | null>;
  list(filter?: ListUsersFilter): Promise<ListUserRecord[]>;
  create(input: CreateUserPersistInput): Promise<UserPublicRecord>;
  update(id: string, data: UpdateUserPersistInput): Promise<UserPublicRecord>;
  linkToDepartamento(
    userId: string,
    departamentoId: string,
    funcao: "GERENTE" | "FUNCIONARIO",
  ): Promise<void>;
}

export type { Role };
