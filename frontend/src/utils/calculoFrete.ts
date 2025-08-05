import { CalcularCustosParams } from "@/types/calcularCustosParams";
import { ParametrosFrete } from "@/types/Parametros";

/**
 * Calcula os custos de frete para um caminhão em uma rota.
 * @param params Parâmetros necessários para o cálculo.
 * @returns Objeto com os custos detalhados.
 */
export function calcularCustosPorCaminhao({
  parametrosGlobais,
  kmTotal,
  pedagioIda,
  pedagioVolta,
  rotaBaseId,
  caminhaoId,
  consumoCombustivel,
  peso,
  diasViagem,
  qtdePneus,
}: CalcularCustosParams & { parametrosGlobais: ParametrosFrete | null }) {
  if (!diasViagem) {
    diasViagem = Math.ceil(kmTotal / 500);
  }

  const qtdeDiesel = kmTotal / (consumoCombustivel ?? 1);
  const custoCombustivel = qtdeDiesel * (parametrosGlobais?.valor_diesel_s10_sem_icms ?? 0);
  const calcArla = qtdeDiesel / (1000 / 50);
  const custoArla = calcArla * 3.90;
  const custoPneus = (parametrosGlobais?.valor_desgaste_pneus ?? 0) * kmTotal * (qtdePneus || 1);
  const custoMotorista = diasViagem * (parametrosGlobais?.valor_salario_motorista_dia ?? 0);
  const refeicaoMotorista = diasViagem * (parametrosGlobais?.valor_refeicao_motorista_dia ?? 0);
  const ajudaCustoMotorista = diasViagem * (parametrosGlobais?.valor_ajuda_custo_motorista ?? 0);
  const chapaDescarga = parametrosGlobais?.valor_chapa_descarga ?? 0;

  const custoTotal =
    (
      pedagioIda +
      pedagioVolta +
      custoCombustivel +
      custoPneus +
      custoMotorista +
      refeicaoMotorista +
      ajudaCustoMotorista +
      chapaDescarga +
      custoArla
    ) * (1 + (parametrosGlobais?.margem_lucro ?? 0) / 100);

  const custoPorKg = peso ? custoTotal / peso : custoTotal / 1;
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
    custo_por_kg: custoPorKg,
  };
}
