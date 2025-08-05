import { ParametrosFrete } from "@/types/Parametros";

export interface CalcularCustosParams {
  parametrosGlobais: ParametrosFrete | null;
  kmTotal: number;
  freteCaminhao: number;
  pedagioIda: number;
  pedagioVolta: number;
  rotaBaseId: number | string | undefined;
  caminhaoId: number | string;
  consumoCombustivel?: number;
  peso?: number;
  diasViagem?: number;
  qtdePneus?: number;
}