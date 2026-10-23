import { avisoRepresentanteContracts } from "../../features/ibc/contracts/avisoRepresentante.contracts";
import { conciliacaoErpContracts } from "../../features/ibc/contracts/conciliacaoErp.contracts";
import { emprestimoAtrasadoContracts } from "../../features/ibc/contracts/emprestimoAtrasado.contracts";
import { ibcProdutoConfigContracts } from "../../features/ibc/contracts/ibcProdutoConfig.contracts";

export const ibcPaths = [
  ...avisoRepresentanteContracts,
  ...conciliacaoErpContracts,
  ...emprestimoAtrasadoContracts,
  ...ibcProdutoConfigContracts,
];
