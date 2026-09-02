export const USER_ROLES = [
  "ADMIN",
  "USER",
  "VENDAS",
  "LOGISTICA",
  "ALMOX",
  "GERENTE_DPTO",
  "MOTORISTA",
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export type CreateUserInput = {
  user: string;
  password: string;
  role: UserRole;
  name: string;
  codRep?: number;
  departamentoId?: string;
};

export type UpdateUserInput = {
  name?: string;
  role?: UserRole;
  codRep?: number;
};

export type UserDepartmentFuncao = "GERENTE" | "FUNCIONARIO";

export type UserDepartmentLinkInput = {
  userId: string;
  departamentoId: string;
  funcao: UserDepartmentFuncao;
};
