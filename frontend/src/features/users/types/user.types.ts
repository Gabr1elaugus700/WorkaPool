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

export type UserDepartmentFuncao = "GERENTE" | "FUNCIONARIO";

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Admin",
  USER: "Usuário",
  VENDAS: "Vendas",
  LOGISTICA: "Logística",
  ALMOX: "Almoxarifado",
  GERENTE_DPTO: "Gerente de departamento",
  MOTORISTA: "Motorista",
};

export function formatUserRoleLabel(role: string | undefined): string {
  if (!role) {
    return "—";
  }
  if ((USER_ROLES as readonly string[]).includes(role)) {
    return USER_ROLE_LABELS[role as UserRole];
  }
  return role;
}

export const USER_FUNCAO_LABELS: Record<UserDepartmentFuncao, string> = {
  GERENTE: "Gerente",
  FUNCIONARIO: "Funcionário",
};

export function formatUserFuncaoLabel(funcao: string | undefined): string {
  if (!funcao) {
    return "—";
  }
  if (funcao === "GERENTE" || funcao === "FUNCIONARIO") {
    return USER_FUNCAO_LABELS[funcao];
  }
  return funcao;
}

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

export type UserDepartmentLinkInput = {
  userId: string;
  departamentoId: string;
  funcao: UserDepartmentFuncao;
};

export type ListUsersQuery = {
  search?: string;
  includeInactive?: boolean;
};

export type ResetUserPasswordInput = {
  password: string;
  mustChangePassword?: boolean;
};
