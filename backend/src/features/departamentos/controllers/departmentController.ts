import { Request, Response } from "express";
import { departmentService } from "../services/departmentService";

export const departmentController = {
  // CRUD básico de departamentos
  create: async (req: Request, res: Response) => {
    try {
      const { name, recebe_os } = req.body;
      
      if (!name) {
        return res.status(400).json({ error: "Nome do departamento é obrigatório" });
      }

      const department = await departmentService.create({ name, recebe_os });
      res.status(201).json(department);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  },

  findAll: async (_req: Request, res: Response) => {
    try {
      const departments = await departmentService.findAll();
      res.json(departments);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  findById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const department = await departmentService.findById(id);
      res.json(department);
    } catch (err: any) {
      res.status(404).json({ error: err.message });
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updatedDepartment = await departmentService.update(id, req.body);
      res.json(updatedDepartment);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await departmentService.delete(id);
      res.status(204).send();
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  },

  // Gestão de usuários no departamento
  addUser: async (req: Request, res: Response) => {
    try {
      const { userId, departamentoId, funcao } = req.body;
      
      if (!userId || !departamentoId) {
        return res.status(400).json({ error: "userId e departamentoId são obrigatórios" });
      }

      const vinculo = await departmentService.addUser(userId, departamentoId, funcao);
      res.status(201).json(vinculo);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  },

  removeUser: async (req: Request, res: Response) => {
    try {
      const { userId, departamentoId } = req.body;
      
      if (!userId || !departamentoId) {
        return res.status(400).json({ error: "userId e departamentoId são obrigatórios" });
      }

      await departmentService.removeUser(userId, departamentoId);
      res.status(204).send();
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  },

  getUsers: async (req: Request, res: Response) => {
    try {
      const { departamentoId } = req.params;
      
      const usuarios = await departmentService.getUsers(departamentoId);
      res.json(usuarios);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  },

  updateUserFunction: async (req: Request, res: Response) => {
    try {
      const { userId, departamentoId, funcao } = req.body;
      
      if (!userId || !departamentoId || !funcao) {
        return res.status(400).json({ error: "userId, departamentoId e funcao são obrigatórios" });
      }

      if (!["GERENTE", "FUNCIONARIO"].includes(funcao)) {
        return res.status(400).json({ error: "Função deve ser GERENTE ou FUNCIONARIO" });
      }

      const updated = await departmentService.updateUserFunction(userId, departamentoId, funcao);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  },

  getManagers: async (req: Request, res: Response) => {
    try {
      const { departamentoId } = req.params;
      
      const gerentes = await departmentService.getManagers(departamentoId);
      res.json(gerentes);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  },

  // Buscar departamentos que recebem OS
  getDepartmentsThatAcceptOS: async (_req: Request, res: Response) => {
    try {
      const departments = await departmentService.findByRecebeOS(true);
      res.json(departments);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
};
