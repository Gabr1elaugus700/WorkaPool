import { Request, Response } from "express";
import { itemChecklistService } from "../services/itemChecklistService";

export const itemChecklistController = {
  create: async (req: Request, res: Response) => {
    if(!req.body.descricao) {
      return res.status(400).json({ message: "Descrição do Item é obrigatória!" });
    }
    try {
      const item = req.body;
      const createdItem = await itemChecklistService.create(item);
      return res.status(201).json(createdItem);
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  },
  
  findAll: async (_req: Request, res: Response) => {
    try {
      const ordens = await itemChecklistService.findAll();
      return res.json(ordens);
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  },

  findById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const ordem = await itemChecklistService.findById(id);
      return res.json(ordem);
    } catch (error: any) {
      return res.status(404).json({ message: error.message });
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const ordem = await itemChecklistService.update(id, req.body);
      return res.json(ordem);
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await itemChecklistService.delete(id);
      return res.status(204).send();
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  },
};
