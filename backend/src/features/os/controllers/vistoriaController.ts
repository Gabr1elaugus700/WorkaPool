import { Request, Response } from "express";
import { vistoriaService } from "../services/vistoriaService";

export const vistoriaController = {
  create: async (req: Request, res: Response) => {
    try {
      const { departamento_id, data_vistoria, responsavel_id } = req.body;
      const createdItem = await vistoriaService.create({ departamento_id, data_vistoria, responsavel_id });
      return res.status(201).json(createdItem);
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  },
  
  findAll: async (_req: Request, res: Response) => {
    try {
      const ordens = await vistoriaService.findAll();
      return res.json(ordens);
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  },

  findById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const ordem = await vistoriaService.findById(id);
      return res.json(ordem);
    } catch (error: any) {
      return res.status(404).json({ message: error.message });
    }
  },

  findByDepartamentoId: async (req: Request, res: Response) => {
    try {
      const { departamento_id } = req.params;
      const ordens = await vistoriaService.findByDepartamentoId(departamento_id);
      return res.json(ordens);
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const ordem = await vistoriaService.update(id, req.body);
      return res.json(ordem);
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await vistoriaService.delete(id);
      return res.status(204).send();
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  },
};
