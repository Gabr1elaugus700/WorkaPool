import { Button } from "@/components/ui/button";
import type { IbcChecklistPadraoDTO } from "../services/ibcChecklistPadraoService";

type Props = {
  padrao: IbcChecklistPadraoDTO;
  canWrite: boolean;
  removing: boolean;
  onRemover: (checklistModeloId: string) => void;
};

export default function IbcChecklistPadraoLinha({ padrao, canWrite, removing, onRemover }: Props) {
  return (
    <li className="flex items-center justify-between gap-3 border-b border-border py-2 last:border-b-0">
      <span className="min-w-0 truncate text-sm text-foreground">{padrao.nome}</span>
      {canWrite ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={removing}
          aria-label={`Remover ${padrao.nome} do padrão`}
          onClick={() => onRemover(padrao.checklistModeloId)}
        >
          Remover
        </Button>
      ) : null}
    </li>
  );
}
