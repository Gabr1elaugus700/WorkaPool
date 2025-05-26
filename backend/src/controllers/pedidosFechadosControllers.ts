import { Request, Response } from "express";
import { getPedidosFechados } from "../services/pedidosFechadosService";

export const getPedFechados = async (req: Request, res: Response): Promise<any> => {
  const codRep = Number(req.query.codRep);


  if (!codRep) {
    return res.status(400).json({ message: "Parâmetros obrigatórios" });
  }

  try {
    const resultado = await getPedidosFechados(Number(codRep)); 
    return res.json(resultado);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro ao Buscar Pedidos" });
  }
};