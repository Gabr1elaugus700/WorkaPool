import { Request, Response } from "express";
import { checklistVistoriaService } from "../services/checklistVistoriaService";

export const checklistVistoriaController = {
  create: async (req: Request, res: Response) => {
    try {
      const { vistoria_id, checklistModeloId, ordemServicoId, itens } = req.body;
      const createdItems = await checklistVistoriaService.create({ vistoria_id, checklistModeloId, ordemServicoId, itens });
      return res.status(201).json(createdItems);
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  },
  
  findAll: async (_req: Request, res: Response) => {
    try {
      const ordens = await checklistVistoriaService.findAll();
      return res.json(ordens);
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  },

  findById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const ordem = await checklistVistoriaService.findById(id);
      return res.json(ordem);
    } catch (error: any) {
      return res.status(404).json({ message: error.message });
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const ordem = await checklistVistoriaService.update(id, req.body);
      return res.json(ordem);
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await checklistVistoriaService.delete(id);
      return res.status(204).send();
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  },
};
