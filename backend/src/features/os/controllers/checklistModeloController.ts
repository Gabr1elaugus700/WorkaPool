import { Request, Response } from "express";
import { checklistModeloService } from "../services/checklistModeloService";

export const checklistModeloController = {
  create: async (req: Request, res: Response) => {
    try {
      const { nome, departamento_id, itens } = req.body;
      const createdItem = await checklistModeloService.create({ nome, departamento_id, itens });
      return res.status(201).json(createdItem);
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  },
  
  findAll: async (_req: Request, res: Response) => {
    try {
      const ordens = await checklistModeloService.findAll();
      return res.json(ordens);
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  },

  findById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const ordem = await checklistModeloService.findById(id);
      return res.json(ordem);
    } catch (error: any) {
      return res.status(404).json({ message: error.message });
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const ordem = await checklistModeloService.update(id, req.body);
      return res.json(ordem);
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await checklistModeloService.delete(id);
      return res.status(204).send();
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  },
};
