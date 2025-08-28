import { Request, Response } from "express";
import { userService } from "../services/userServiceClean";

export const authController = {
  register: async (req: Request, res: Response) => {
    const { user, password, role, name, codRep } = req.body;

    try {
      const createdUser = await userService.register(user, password, role, name, codRep);
      res.status(201).json(createdUser);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
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
      const { id } = req.params;
      const user = await userService.findById(id);
      res.json(user);
    } catch (err: any) {
      res.status(404).json({ error: err.message });
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updatedUser = await userService.update(id, req.body);
      res.json(updatedUser);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await userService.delete(id);
      res.status(204).send();
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  },

  // Buscar departamentos de um usuário específico (mantém no users pois é informação do usuário)
  getUserDepartments: async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      
      const departamentos = await userService.buscarDepartamentosDoUsuario(userId);
      res.json(departamentos);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }
};
