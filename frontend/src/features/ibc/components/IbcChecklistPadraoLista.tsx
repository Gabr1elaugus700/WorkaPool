import type { IbcChecklistPadraoDTO } from "../services/ibcChecklistPadraoService";
import IbcChecklistPadraoLinha from "./IbcChecklistPadraoLinha";

type Props = {
  padroes: IbcChecklistPadraoDTO[];
  canWrite: boolean;
  removingId: string | null;
  onRemover: (checklistModeloId: string) => void;
};

export default function IbcChecklistPadraoLista({ padroes, canWrite, removingId, onRemover }: Props) {
  if (padroes.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum checklist padrão</p>;
  }
  return (
    <ul>
      {padroes.map((padrao) => (
        <IbcChecklistPadraoLinha
          key={padrao.checklistModeloId}
          padrao={padrao}
          canWrite={canWrite}
          removing={removingId === padrao.checklistModeloId}
          onRemover={onRemover}
        />
      ))}
    </ul>
  );
}
