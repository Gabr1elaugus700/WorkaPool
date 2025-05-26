import { Request, Response } from "express";
import { getPedidosPorCarga } from '../services/pedidosCargaService';

export const getPedCargas = async (req: Request, res: Response): Promise<any> => {
  const codCarParam = req.query.codCar;

  if (!codCarParam || isNaN(Number(codCarParam))) {
    return res.status(400).json({ message: "Parâmetro 'codCar' é obrigatório e deve ser numérico." });
  }

  const codCar = Number(codCarParam);

  try {
    const resultado = await getPedidosPorCarga(codCar);
    return res.json(resultado);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro ao Buscar Pedidos Dessa Carga!" });
  }
};
