import { UpdatePedidoCarga } from "../repositories/alteraPedidoCargaRepository";

export async function atualizarPedidoNaCarga(numPed: number, codCar: number, posCar: number) {
  // console.log('📥 Dados recebidos Service:', { numPed, codCar, posCar });
  if (numPed == null || codCar == null || posCar == null) {
  throw new Error("Dados obrigatórios ausentes");
}


  const resultado = await UpdatePedidoCarga(codCar, posCar, numPed);

  if (resultado === 0) {
    throw new Error(`Pedido ${numPed} não encontrado ou não pôde ser atualizado.`);
  }

  return { message: "Pedido atualizado com sucesso." };
}
