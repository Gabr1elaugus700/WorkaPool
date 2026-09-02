import { Role } from "@prisma/client";
import {
  CreateUserPersistInput,
  UserPublicRecord,
} from "../types/User.types";

export interface IUserRepository {
  findByLogin(login: string): Promise<UserPublicRecord | null>;
  create(input: CreateUserPersistInput): Promise<UserPublicRecord>;
  linkToDepartamento(
    userId: string,
    departamentoId: string,
    funcao: "GERENTE" | "FUNCIONARIO",
  ): Promise<void>;
}

export type { Role };
