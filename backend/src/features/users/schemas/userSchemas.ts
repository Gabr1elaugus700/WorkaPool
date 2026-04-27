import { z } from "zod";

// Schemas para autenticação
export const registerSchema = z.object({
  body: z.object({
    user: z.string().min(3, "Usuário deve ter pelo menos 3 caracteres"),
    password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
    role: z.enum(["ADMIN", "USER", "VENDAS", "LOGISTICA", "ALMOX", "GERENTE_DPTO"]).default("USER"),
    name: z.string().min(1, "Nome é obrigatório"),
    codRep: z.number().int().positive().default(999)
  })
});

export const loginSchema = z.object({
  body: z.object({
    user: z.string().min(1, "Usuário é obrigatório"),
    password: z.string().min(1, "Senha é obrigatória")
  })
});

export const changePasswordFirstLoginSchema = z.object({
  body: z.object({
    user: z.string().min(1, "Usuário é obrigatório"),
    newPassword: z.string().min(6, "Nova senha deve ter pelo menos 6 caracteres")
  })
});

// Schemas para CRUD de usuários
export const findAllUsersQuerySchema = z.object({
  query: z.object({
    user: z.string().optional(),
    name: z.string().optional(),
    role: z.enum(["ADMIN", "USER", "VENDAS", "LOGISTICA", "ALMOX", "GERENTE_DPTO"]).optional(),
    codRep: z.number().int().positive().optional(),
    mustChangePassword: z.boolean().optional(),
    page: z.coerce.number().int().positive().optional(),
    pageSize: z.coerce.number().int().positive().max(100).optional()
  })
});

export const updateUserSchema = z.object({
  params: z.object({
    id: z.string().uuid("ID deve ser um UUID válido")
  }),
  body: z.object({
    name: z.string().min(1).optional(),
    role: z.enum(["ADMIN", "USER", "VENDAS", "LOGISTICA", "ALMOX", "GERENTE_DPTO"]).optional(),
    codRep: z.number().int().positive().optional(),
    mustChangePassword: z.boolean().optional()
  })
});

export const deleteUserSchema = z.object({
  params: z.object({
    id: z.string().uuid("ID deve ser um UUID válido")
  })
});

export const getUserByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid("ID deve ser um UUID válido")
  })
});

// Schema para buscar departamentos de um usuário específico
export const getUserDepartmentsSchema = z.object({
  params: z.object({
    id: z.string().uuid("ID do usuário deve ser um UUID válido")
  })
});

export const roleSchema = z.enum([
  "ADMIN",
  "USER",
  "VENDAS",
  "LOGISTICA",
  "ALMOX",
  "GERENTE_DPTO",
]);

export const departamentoSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
});

export const userDepartamentoSchema = z.object({
  user_id: z.string().uuid().optional(),
  departamento_id: z.string().uuid().optional(),
  ativo: z.boolean().optional(),
  funcao: z.string().optional(),
  departamento: departamentoSchema.optional(),
});

export const userSummarySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  user: z.string(),
  role: roleSchema,
  createdAt: z.string().datetime().or(z.date()),
  departamentos: z.array(userDepartamentoSchema).optional(),
});

export const userResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  user: z.string(),
  role: roleSchema,
  codRep: z.number(),
  mustChangePassword: z.boolean(),
});

export const paginatedUsersResponseSchema = z.object({
  data: z.array(userSummarySchema),
  pagination: z.object({
    page: z.number().int().positive(),
    pageSize: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    totalPages: z.number().int().positive(),
    hasNextPage: z.boolean(),
    hasPreviousPage: z.boolean(),
  }),
});

export const userDepartmentsResponseSchema = z.array(userDepartamentoSchema);
