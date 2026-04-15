
import { osService } from "../services/osService";
import { StatusOrdemServico, Prioridade } from "@prisma/client";
import { Request, Response } from "express";

interface MulterRequest extends Request {
  files: Express.Multer.File[];
}

export const osController = {
  create: async (req: Request, res: Response) => {

    if (!req.body.descricao) {
      return res.status(400).json({ message: "Campos obrigatórios faltando!" });
    }

    const imagens = Array.isArray((req as MulterRequest).files) ? (req as MulterRequest).files.map(file => `/uploads/${file.filename}`) : [];
    try {
      const ordem = await osService.create({
        descricao: req.body.descricao,
        problema: req.body.problema || "",
        status: req.body.status ? StatusOrdemServico[req.body.status as keyof typeof StatusOrdemServico] : StatusOrdemServico.ABERTA,
        prioridade: req.body.prioridade ? Prioridade[req.body.prioridade as keyof typeof Prioridade] : Prioridade.BAIXA,
        email_solicitante: req.body.email_solicitante,
        solicitante: req.body.id_solicitante ? { connect: { user: req.body.id_solicitante } } : undefined,
        departamento_os: req.body.id_departamento
          ? { connect: { id: req.body.id_departamento } }
          : undefined,
        localizacao: req.body.localizacao,
        imagens: imagens.length > 0 ? {
          create: imagens.map((url: string) => ({ imagem_url: url }))
        } : undefined
      });
      console.log("Ordem de Serviço criada:", ordem);
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
