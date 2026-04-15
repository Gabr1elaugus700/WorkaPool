import { z } from "zod";

// Schemas para autenticação
export const registerSchema = z.object({
  body: z.object({
    user: z.string().min(3, "Usuário deve ter pelo menos 3 caracteres"),
    password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
    role: z.enum(["ADMIN", "USER", "VENDAS", "LOGISTICA", "ALMOX", "GERENTE_DPTO"]).optional(),
    name: z.string().min(1, "Nome é obrigatório").optional(),
    codRep: z.number().int().positive().optional()
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
    userId: z.string().uuid("ID do usuário deve ser um UUID válido")
  })
});
