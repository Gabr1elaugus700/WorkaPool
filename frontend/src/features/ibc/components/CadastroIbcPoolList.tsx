import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { IbcCadastroDTO } from "../types/ibcCadastro.types";
import { ibcCadastroLabels } from "../utils/ibcCadastroLabels";
import { podeInspecionarIbc } from "../utils/ibcInspecao.utils";
import {
  isIbcNaoHomologado,
  isIbcSubstituido,
} from "../utils/ibcMudanca.utils";

type Props = {
  items: IbcCadastroDTO[];
  canWrite: boolean;
  actionsDisabled?: boolean;
  onConverter: (ibc: IbcCadastroDTO) => void;
  onMudarProduto: (ibc: IbcCadastroDTO) => void;
  onVerHistorico: (ibc: IbcCadastroDTO) => void;
  onGerenciarChecklists: (ibc: IbcCadastroDTO) => void;
  onInspecionar: (ibc: IbcCadastroDTO) => void;
  onVerInspecoes: (ibc: IbcCadastroDTO) => void;
};

function formatDataLimite(value: string | null): string {
  if (!value) return "—";
  return value.slice(0, 10);
}

export default function CadastroIbcPoolList({
  items,
  canWrite,
  actionsDisabled = false,
  onConverter,
  onMudarProduto,
  onVerHistorico,
  onGerenciarChecklists,
  onInspecionar,
  onVerInspecoes,
}: Props) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhum IBC ativo no pool.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-border">
      {items.map((ibc) => {
        const substituido = isIbcSubstituido(ibc);
        return (
          <li
            key={ibc.id}
            className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex flex-col gap-1">
              <span className="font-medium">{ibc.identificador}</span>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <Badge
                  variant={ibc.aptidao === "APTO" ? "default" : "secondary"}
                  className="text-[10px]"
                >
                  {ibcCadastroLabels.aptidao[ibc.aptidao]}
                </Badge>
                {ibc.motivoInaptidao ? (
                  <Badge variant="outline" className="text-[10px]">
                    {ibcCadastroLabels.motivoInaptidao[ibc.motivoInaptidao]}
                  </Badge>
                ) : null}
                {ibc.primeiraInspecaoEm == null ? (
                  <Badge variant="outline" className="text-[10px]">
                    {ibcCadastroLabels.alertaMotivo.SEM_INSPECAO}
                  </Badge>
                ) : null}
                {isIbcNaoHomologado(ibc) ? (
                  <Badge variant="outline" className="text-[10px]">
                    Não homologado
                  </Badge>
                ) : null}
                {substituido ? (
                  <Badge variant="outline" className="text-[10px]">
                    Substituído
                  </Badge>
                ) : null}
                <span>limite {formatDataLimite(ibc.dataLimite)}</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-1">
              {canWrite && podeInspecionarIbc(ibc) ? (
                <Button type="button" variant="ghost" size="sm" onClick={() => onInspecionar(ibc)}>
                  Inspecionar
                </Button>
              ) : null}
              {canWrite && !substituido && !isIbcNaoHomologado(ibc) ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={actionsDisabled}
                  onClick={() => onConverter(ibc)}
                >
                  Converter p/ não homologado
                </Button>
              ) : null}
              {canWrite && !substituido ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={actionsDisabled}
                  onClick={() => onMudarProduto(ibc)}
                >
                  Mudar produto
                </Button>
              ) : null}
              {canWrite && !substituido ? (
                <Button type="button" variant="ghost" size="sm" onClick={() => onGerenciarChecklists(ibc)}>
                  Checklists
                </Button>
              ) : null}
              <Button type="button" variant="ghost" size="sm" onClick={() => onVerInspecoes(ibc)}>
                Inspeções
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onVerHistorico(ibc)}
              >
                Histórico
              </Button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
