import type { IbcAlertDetalhesDTO } from "../types/ibcCadastro.types";
import {
  formatAlocacaoAlerta,
  formatItensAbaixoDoMinimo,
  formatMediaVsMinima,
} from "../utils/ibcInspecao.utils";

type Props = {
  detalhes: IbcAlertDetalhesDTO;
};

export default function IbcAlertaReprovacaoDetalhes({ detalhes }: Props) {
  return (
    <div className="mt-1 space-y-1 text-xs">
      {detalhes.checklists.map((checklist) => (
        <div key={checklist.checklistModeloId}>
          <p>
            <span className="font-medium">{checklist.nome}</span>
            <span className="text-muted-foreground">
              {" · "}
              {formatMediaVsMinima(checklist.mediaObtida, checklist.mediaMinima)}
            </span>
          </p>
          {checklist.itensAbaixoDoMinimo.length > 0 ? (
            <p className="text-destructive">
              Abaixo do mínimo: {formatItensAbaixoDoMinimo(checklist.itensAbaixoDoMinimo)}
            </p>
          ) : null}
        </div>
      ))}
      {detalhes.alocacao ? (
        <p className="font-medium text-destructive">{formatAlocacaoAlerta(detalhes.alocacao)}</p>
      ) : null}
    </div>
  );
}
