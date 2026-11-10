import { Button } from "@/components/ui/button";
import { DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useIbcChecklistPadrao } from "../hooks/useIbcChecklistPadrao";
import { listChecklistsDisponiveisParaVinculo } from "../utils/ibcChecklist.utils";
import { mensagemPadraoChecklist } from "../utils/ibcChecklistPadraoMensagem";
import { toError } from "../utils/toError";
import IbcChecklistPadraoAdicionar from "./IbcChecklistPadraoAdicionar";
import IbcChecklistPadraoLista from "./IbcChecklistPadraoLista";

export type IbcChecklistPadraoAlvo = { nome: string; produtoId: string | null };

type Props = {
  alvo: IbcChecklistPadraoAlvo;
  canWrite: boolean;
  onClose: () => void;
};

export default function IbcChecklistPadraoDialog({ alvo, canWrite, onClose }: Props) {
  const padrao = useIbcChecklistPadrao(alvo.produtoId, canWrite);
  const vinculos = padrao.query.data ?? [];
  const modelos = padrao.modelos.data ?? [];
  const disponiveis = listChecklistsDisponiveisParaVinculo(modelos, vinculos);
  const erro = padrao.query.error
    ? toError(padrao.query.error).message
    : padrao.vincular.error
      ? mensagemPadraoChecklist(padrao.vincular.error)
      : padrao.desvincular.error
        ? toError(padrao.desvincular.error).message
        : null;
  const ocupado = padrao.vincular.isPending || padrao.desvincular.isPending;

  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle>Checklist padrão · {alvo.nome}</DialogTitle>
        <DialogDescription>
          Vale na Entrada no pátio dos containers que nascerem com este produto.
        </DialogDescription>
      </DialogHeader>
      {alvo.produtoId == null ? (
        <p className="text-sm text-muted-foreground">Salve a sigla e a cor antes de definir o padrão de checklist.</p>
      ) : padrao.query.isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando padrão…</p>
      ) : padrao.query.isError ? null : (
        <>
          <IbcChecklistPadraoLista
            padroes={vinculos}
            canWrite={canWrite}
            removingId={padrao.desvincular.isPending ? padrao.desvincular.variables ?? null : null}
            onRemover={(checklistModeloId) => {
              void padrao.desvincular.mutate(checklistModeloId);
            }}
          />
          {canWrite ? (
            <IbcChecklistPadraoAdicionar
              disponiveis={disponiveis}
              hasChecklistAtivo={modelos.some((checklist) => checklist.ativo)}
              submitting={padrao.vincular.isPending}
              onIncluir={async (checklistModeloId) => {
                try {
                  await padrao.vincular.mutateAsync(checklistModeloId);
                  return true;
                } catch {
                  return false;
                }
              }}
            />
          ) : null}
        </>
      )}
      {erro ? <p role="alert" className="text-sm text-destructive">{erro}</p> : null}
      <div className="flex justify-end">
        <Button type="button" variant="outline" onClick={onClose} disabled={ocupado}>
          Fechar
        </Button>
      </div>
    </div>
  );
}
