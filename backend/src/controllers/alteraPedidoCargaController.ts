import { Request, Response } from "express";
import { atualizarPedidoNaCarga } from "../services/alteraPedidoCargaService";

export const updatePedido = async (req: Request, res: Response): Promise<any> => {
  const { numPed } = req.params;
  const { codCar, posCar } = req.body;

  try {
    // console.log('📥 Dados recebidos - Controller:', { numPed, codCar, posCar });
    if (!numPed || codCar == null || posCar == null) {
      return res.status(400).json({ error: "Dados obrigatórios ausentes para atualização de carga." });
    }


    const resultado = await atualizarPedidoNaCarga(
      Number(numPed),
      Number(codCar),
      Number(posCar)
    );

    res.status(200).json(resultado);
  } catch (error: any) {
    console.error("[❌ ERRO INTERNO AO ATUALIZAR PEDIDO]", error);
    res.status(500).json({ error: error?.message || "Erro ao atualizar o pedido" });
  }
};
