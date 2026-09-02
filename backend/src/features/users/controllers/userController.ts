import { Request, Response } from "express";
import { Role } from "@prisma/client";
import { AppError } from "../../../utils/AppError";
import { userService } from "../services/userService";
import { CreateUserUseCase } from "../useCases/CreateUserUseCase";

function handleAppError(err: unknown, res: Response, fallbackStatus = 500): Response {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
      details: err.details,
    });
  }

  const message = err instanceof Error ? err.message : "Erro interno";
  return res.status(fallbackStatus).json({ error: message });
}

export const authController = {
  register: async (_req: Request, res: Response) => {
    return res.status(403).json({
      error: "Cadastro público desabilitado. Solicite criação de conta ao administrador.",
      code: "REGISTER_DISABLED",
    });
  },
  login: async (req: Request, res: Response) => {
    const { user, password } = req.body;

    try {
      const { token, mustChangePassword } = await userService.login(user, password);
      res.json({ token, mustChangePassword });
    } catch (err: any) {
      res.status(401).json({ error: err.message });
    }
  },

  changePasswordFirstLogin: async (req: Request, res: Response) => {
    const { user, newPassword } = req.body;
    try {
      const result = await userService.changePasswordFirstLogin(user, newPassword);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }
};

export const userController = {
  create: async (req: Request, res: Response) => {
    const { user, password, role, name, codRep, departamentoId } = req.body;

    try {
      const useCase = new CreateUserUseCase();
      const createdUser = await useCase.execute({
        user,
        password,
        role: role as Role,
        name,
        codRep,
        departamentoId,
      });
      res.status(201).json(createdUser);
    } catch (err: unknown) {
      return handleAppError(err, res, 400);
    }
  },

  // CRUD básico de usuários
  findAll: async (_req: Request, res: Response) => {
    try {
      const users = await userService.findAll();
      res.json(users);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  findById: async (req: Request, res: Response) => {
    try {
      const id = String(req.params.id);
      const user = await userService.findById(id);
      res.json(user);
    } catch (err: any) {
      res.status(404).json({ error: err.message });
    }
  },

  update: async (req: Request, res: Response) => {
    console.log("Request body received in update:", req.body);
    try {
      const id = String(req.params.id);
      const updatedUser = await userService.update(id, req.body);
      res.json(updatedUser);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      const id = String(req.params.id);
      await userService.delete(id);
      res.status(204).send();
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  },

  // Buscar departamentos de um usuário específico (mantém no users pois é informação do usuário)
  getUserDepartments: async (req: Request, res: Response) => {
    try {
      const id = String(req.params.id);

      const departamentos = await userService.buscarDepartamentosDoUsuario(id);
      res.json(departamentos);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }
};
