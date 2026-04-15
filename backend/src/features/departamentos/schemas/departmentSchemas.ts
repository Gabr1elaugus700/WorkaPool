import { z } from "zod";

// Schemas para CRUD de departamentos
export const createDepartmentSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Nome do departamento é obrigatório"),
    recebe_os: z.boolean().optional().default(false)
  })
});

export const updateDepartmentSchema = z.object({
  params: z.object({
    id: z.string().uuid("ID deve ser um UUID válido")
  }),
  body: z.object({
    name: z.string().min(1).optional(),
    recebe_os: z.boolean().optional()
  })
});

export const getDepartmentByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid("ID deve ser um UUID válido")
  })
});

export const deleteDepartmentSchema = z.object({
  params: z.object({
    id: z.string().uuid("ID deve ser um UUID válido")
  })
});

// Schemas para gestão de usuários no departamento
export const addUserToDepartmentSchema = z.object({
  body: z.object({
    userId: z.string().uuid("ID do usuário deve ser um UUID válido"),
    departamentoId: z.string().uuid("ID do departamento deve ser um UUID válido"),
    funcao: z.enum(["GERENTE", "FUNCIONARIO"]).optional().default("FUNCIONARIO")
  })
});

export const removeUserFromDepartmentSchema = z.object({
  body: z.object({
    userId: z.string().uuid("ID do usuário deve ser um UUID válido"),
    departamentoId: z.string().uuid("ID do departamento deve ser um UUID válido")
  })
});

export const getDepartmentUsersSchema = z.object({
  params: z.object({
    departamentoId: z.string().uuid("ID do departamento deve ser um UUID válido")
  })
});

export const updateUserFunctionSchema = z.object({
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
