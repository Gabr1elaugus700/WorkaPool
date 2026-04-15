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

// Schemas para gestão de departamentos
export const addToDepartamentoSchema = z.object({
  body: z.object({
    userId: z.string().uuid("ID do usuário deve ser um UUID válido"),
    departamentoId: z.string().uuid("ID do departamento deve ser um UUID válido"),
    funcao: z.enum(["GERENTE", "FUNCIONARIO"]).optional().default("FUNCIONARIO")
  })
});

export const removeFromDepartamentoSchema = z.object({
  body: z.object({
    userId: z.string().uuid("ID do usuário deve ser um UUID válido"),
    departamentoId: z.string().uuid("ID do departamento deve ser um UUID válido")
  })
});

export const getUsersFromDepartmentSchema = z.object({
  params: z.object({
    departamentoId: z.string().uuid("ID do departamento deve ser um UUID válido")
  })
});

export const getUserDepartmentsSchema = z.object({
  params: z.object({
    userId: z.string().uuid("ID do usuário deve ser um UUID válido")
  })
});

export const updateFunctionInDepartmentSchema = z.object({
  body: z.object({
    userId: z.string().uuid("ID do usuário deve ser um UUID válido"),
    departamentoId: z.string().uuid("ID do departamento deve ser um UUID válido"),
    funcao: z.enum(["GERENTE", "FUNCIONARIO"], {
      errorMap: () => ({ message: "Função deve ser GERENTE ou FUNCIONARIO" })
    })
  })
});

export const getDepartmentManagersSchema = z.object({
  params: z.object({
    departamentoId: z.string().uuid("ID do departamento deve ser um UUID válido")
  })
});
