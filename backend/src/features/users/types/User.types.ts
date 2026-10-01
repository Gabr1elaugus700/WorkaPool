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
  isActive: boolean;
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
  password?: string;
  mustChangePassword?: boolean;
  isActive?: boolean;
};

export type AdminResetPasswordInput = {
  targetUserId: string;
  newPassword: string;
  mustChangePassword?: boolean;
};

export type SetUserActiveInput = {
  targetUserId: string;
  isActive: boolean;
};

export type ListUsersFilter = {
  search?: string;
  includeInactive?: boolean;
};

export type ListUserDepartmentLink = {
  funcao: string;
  departamento: { id: string; name: string };
};

export type ListUserRecord = UserPublicRecord & {
  createdAt: Date;
  departamentos: ListUserDepartmentLink[];
};
