import { Request, Response } from "express";
import { dptosService } from "../services/departamentosService";
 
export const dptosController = {
  create: async (req: Request, res: Response) => {
    if(!req.body.name) {
      return res.status(400).json({ message: "Nome do departamento é obrigatório!" });
    }

    try {
      const departamento = await dptosService.create({ 
        ...req.body,
      });
      return res.status(201).json(departamento);
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  },

  findAll: async (_req: Request, res: Response) => {
    try {
      const departamentos = await dptosService.findAll();
      return res.json(departamentos);
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  },


  findById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const departamento = await dptosService.findById(id);
      return res.json(departamento);
    } catch (error: any) {
      return res.status(404).json({ message: error.message });
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const departamento = await dptosService.update(id, req.body);
      return res.json(departamento);
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await dptosService.delete(id);
      return res.status(204).send();
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  },
};
