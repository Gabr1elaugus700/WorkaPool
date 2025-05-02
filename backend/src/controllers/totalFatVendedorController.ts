import { Request, Response } from 'express';
import { getFaturamento } from '../services/totalFatVendedorService';

export const faturamentoPorVendedor = async (req: Request, res: Response): Promise<any> => {
  const { codRep, dataInicio } = req.body;

  if (!codRep || !dataInicio) {
    return res.status(400).json({ message: 'Parâmetros obrigatórios: codRep e dataInicio' });
  }

  try {
    const faturamento = await getFaturamento(Number(codRep), new Date(dataInicio));
    return res.json(faturamento);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erro interno ao consultar faturamento' });
  }
};
