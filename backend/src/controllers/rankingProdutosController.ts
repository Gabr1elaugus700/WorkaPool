import { Request, Response } from "express";
import { getRankingProdutos } from "../services/rankingProdutosService";

export const rankingProdutosVendidos = async (req: Request, res: Response): Promise<any> => {
  const { codRep, dataInicio, top } = req.body;

  if (!codRep || !dataInicio) {
    return res.status(400).json({ message: "Parâmetros obrigatórios" });
  }

  try {
    const resultado = await getRankingProdutos(Number(codRep), new Date(dataInicio), Number(top) ?? 10); 
    return res.json(resultado);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro ao gerar ranking" });
  }
};
