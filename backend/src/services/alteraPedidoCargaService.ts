import { UpdatePedidoCarga } from "../repositories/alteraPedidoCargaRepository";

export async function atualizarPedidoNaCarga(
  numPed: number,
  codCar: number,
  posCar: number
) {
  if (!numPed || !codCar || !posCar) {
    throw new Error("Dados obrigatórios ausentes para atualização de carga.");
  }

  const resultado = await UpdatePedidoCarga(codCar, posCar, numPed);

  if (resultado === 0) {
    throw new Error(`Pedido ${numPed} não encontrado ou não pôde ser atualizado.`);
  }

  return { message: "Pedido atualizado com sucesso." };
}
