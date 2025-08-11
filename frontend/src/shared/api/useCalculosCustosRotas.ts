interface CalcularCustosParams {
  parametrosGlobais: {
    custoCombustivelKm: number;
    desgastePneusKm: number;
    salarioMotorista: number;
    refeicaoMotorista: number;
    ajudaCustoMotorista: number;
    chapaDescarga: number;
    capacidadeCargaKg: number;
  };
  kmTotal: number;
  freteCaminhao: number;
  pedagioIda: number;
  pedagioVolta: number;
  rotaBaseId: number | string | undefined;
  caminhaoId: number | string;
}

export function calcularCustosPorCaminhao({
  parametrosGlobais,
  kmTotal,
  pedagioIda,
  pedagioVolta,
  rotaBaseId,
  caminhaoId,
}: CalcularCustosParams) {
  const custoCombustivel = kmTotal * parametrosGlobais.custoCombustivelKm;
  const custoPneus = kmTotal * parametrosGlobais.desgastePneusKm;
  const custoMotorista = parametrosGlobais.salarioMotorista;
  const refeicaoMotorista = parametrosGlobais.refeicaoMotorista;
  const ajudaCustoMotorista = parametrosGlobais.ajudaCustoMotorista;
  const chapaDescarga = parametrosGlobais.chapaDescarga;

  const custoTotal =
    pedagioIda +
    pedagioVolta +
    custoCombustivel +
    custoPneus +
    custoMotorista +
    refeicaoMotorista +
    ajudaCustoMotorista +
    chapaDescarga;

  const custoPorKg = custoTotal / parametrosGlobais.capacidadeCargaKg;

  return {
    rota_base_id: rotaBaseId,
    caminhao_id: caminhaoId,
    pedagio_ida: pedagioIda,
    pedagio_volta: pedagioVolta,
    custo_combustivel: custoCombustivel,
    custo_total: custoTotal,
    salario_motorista_rota: custoMotorista,
    refeicao_motorista_rota: refeicaoMotorista,
    ajuda_custo_motorista_rota: ajudaCustoMotorista,
    chapa_descarga_rota: chapaDescarga,
    desgaste_pneus_rota: custoPneus,
    custo_por_kg: custoPorKg
  };
}
