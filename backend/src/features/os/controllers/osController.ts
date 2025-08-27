import { Request, Response } from "express";
import { osService } from "../services/osService";
import { StatusOrdemServico, Prioridade } from "@prisma/client";

export const osController = {
  create: async (req: Request, res: Response) => {
    if(!req.body.descricao) {
      return res.status(400).json({ message: "Descrição do serviço é obrigatória!" });
    }
    if(!req.body.id_departamento) {
      return res.status(400).json({ message: "ID do departamento é obrigatório!" });
    }

    try {
      const ordem = await osService.create({ 
        descricao: req.body.descricao,
        status: req.body.status ? StatusOrdemServico[req.body.status as keyof typeof StatusOrdemServico] : StatusOrdemServico.ABERTA,
        prioridade: req.body.prioridade ? Prioridade[req.body.prioridade as keyof typeof Prioridade] : Prioridade.BAIXA,
        email_solicitante: req.body.email_solicitante,
        solicitante: req.body.id_solicitante ? { connect: { user: req.body.id_solicitante } } : undefined,
        departamento_os: {
          connect: { id: req.body.id_departamento }
        }
      });
      return res.status(201).json(ordem);
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  },

  findAll: async (_req: Request, res: Response) => {
    try {
      const ordens = await osService.findAll();
      return res.json(ordens);
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  },

  findById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const ordem = await osService.findById(id);
      return res.json(ordem);
    } catch (error: any) {
      return res.status(404).json({ message: error.message });
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const ordem = await osService.update(id, req.body);
      return res.json(ordem);
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await osService.delete(id);
      return res.status(204).send();
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  },
};
