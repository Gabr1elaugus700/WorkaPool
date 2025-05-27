import { Request, Response } from "express";
import { atualizarPedidoNaCarga } from "../services/alteraPedidoCargaService";

export const updatePedido = async (req: Request, res: Response) : Promise<any> => {
  const { numPed } = req.params;
  const { codCar, posCar } = req.body;

  try {
    if (!numPed || codCar === undefined || posCar === undefined) {
      return res.status(400).json({ error: "Dados obrigatórios ausentes." });
    }

    const resultado = await atualizarPedidoNaCarga(
      Number(numPed),
      Number(codCar),
      Number(posCar)
    );

    res.status(200).json(resultado);
  } catch (error) {
    console.error("[Erro ao atualizar pedido]", error);
    res.status(500).json({ error: "Erro ao atualizar o pedido" });
  }
};
