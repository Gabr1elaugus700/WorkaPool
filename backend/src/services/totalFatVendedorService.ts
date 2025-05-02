import { buscarFaturamentoVendedor } from '../repositories/totalFatVendedorRepoitory';

export const getFaturamento = async (codRep: number, dataInicio: Date) => {
  const resultado = await buscarFaturamentoVendedor(codRep, dataInicio);
  
  if (resultado.length === 0) {
    return { total: 0, vendedor: null };
  }

  const { TOTAL, VENDEDOR, QUANT } = resultado[0];
  return { total: TOTAL, vendedor: VENDEDOR, totalkg: QUANT };
};
