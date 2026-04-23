import { Request, Response } from "express";
import { ZodError } from "zod";
import { userService } from "../services/userService";
import { AppError } from "../../../utils/AppError";
import { LoginUserInput, RegisterUserInput } from "../entities/User";
import {
  findAllUsersQuerySchema,
  getUserByIdSchema,
  updateUserSchema,
  deleteUserSchema,
  getUserDepartmentsSchema,
} from "../schemas/userSchemas";

function handleControllerError(res: Response, err: unknown, fallbackMessage: string) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      message: "Erro de validação",
      errors: err.issues,
    });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
      details: err.details,
    });
  }

  return res.status(500).json({ error: fallbackMessage });
}

export const authController = {
  register: async (req: Request, res: Response) => {
    try {
      const data = req.body as RegisterUserInput;
      const createdUser = await userService.register(data);
      res.status(201).json(createdUser);
    } catch (err: unknown) {
      return handleControllerError(res, err, "Erro ao criar usuário");
    }
  },

  login: async (req: Request, res: Response) => {
    const { user, password } = req.body as LoginUserInput;

    try {
      const { token, mustChangePassword } = await userService.login(user, password);
      res.json({ token, mustChangePassword });
    } catch (err: unknown) {
      return handleControllerError(res, err, "Erro ao fazer login");
    }
  },

  changePasswordFirstLogin: async (req: Request, res: Response) => {
    try {
      const { user, newPassword } = req.body as { user: string; newPassword: string };
      const result = await userService.changePasswordFirstLogin(user, newPassword);
      res.json(result);
    } catch (err: unknown) {
      return handleControllerError(res, err, "Erro ao alterar senha");
    }
  },
};

export const userController = {

  findAll: async (req: Request, res: Response) => {
    try {
      const { query } = findAllUsersQuerySchema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      const result = await userService.findAll({ page: query.page, pageSize: query.pageSize });
      res.json(result);
    } catch (err: unknown) {
      return handleControllerError(res, err, "Erro ao buscar usuários");
    }
  },

  findById: async (req: Request, res: Response) => {
    try {
      const { params } = getUserByIdSchema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      const user = await userService.findById(params.id);
      res.json(user);
    } catch (err: unknown) {
      return handleControllerError(res, err, "Erro ao buscar usuário");
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const { params, body } = updateUserSchema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      const updatedUser = await userService.update(params.id, body);
      res.json(updatedUser);
    } catch (err: unknown) {
      return handleControllerError(res, err, "Erro ao atualizar usuário");
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      const { params } = deleteUserSchema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      await userService.delete(params.id);
      res.status(204).send();
    } catch (err: unknown) {
      return handleControllerError(res, err, "Erro ao deletar usuário");
    }
  },

  // Buscar departamentos de um usuário específico (mantém no users pois é informação do usuário)
  getUserDepartments: async (req: Request, res: Response) => {
    try {
      const { params } = getUserDepartmentsSchema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      const departamentos = await userService.buscarDepartamentosDoUsuario(params.id);
      res.json(departamentos);
    } catch (err: unknown) {
      return handleControllerError(res, err, "Erro ao buscar departamentos do usuário");
    }
  },
};

