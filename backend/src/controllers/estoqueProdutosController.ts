import { Request, Response } from "express";
import { getProdutosEstoqueService } from "../services/estoqueProdutosService";

export async function getProdutosEstoqueController(req: Request, res: Response): Promise<any> {
  try {
    const data = await getProdutosEstoqueService();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: "Erro ao buscar produtos em estoque" });
  }
}
