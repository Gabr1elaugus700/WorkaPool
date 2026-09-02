import { Role } from "@prisma/client";

export type CreateUserInput = {
  user: string;
  password: string;
  role: Role;
  name: string;
  codRep?: number;
  departamentoId?: string;
};

export type UserPublicRecord = {
  id: string;
  user: string;
  role: Role;
  name: string;
  codRep: number;
  mustChangePassword: boolean;
};

export type CreateUserPersistInput = {
  user: string;
  passwordHash: string;
  role: Role;
  name: string;
  codRep: number;
  mustChangePassword: boolean;
};

export type UpdateUserInput = {
  targetUserId: string;
  actorUserId: string;
  name?: string;
  role?: Role;
  codRep?: number;
};

export type UpdateUserPersistInput = {
  name?: string;
  role?: Role;
  codRep?: number;
};
