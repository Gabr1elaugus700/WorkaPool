import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { formatIsoDateTimeLabel } from "@/utils/formatDate";
import { useIbcInspecoes } from "../hooks/useIbcInspecao";
import type { IbcCadastroDTO } from "../types/ibcCadastro.types";
import type { IbcInspecaoHistoricoDTO } from "../types/ibcInspecao.types";
import { ibcCadastroLabels } from "../utils/ibcCadastroLabels";
import {
  formatMediaVsMinima,
  formatNotaInspecao,
  isNotaAbaixoDoMinimo,
  notaMinimaDoItem,
} from "../utils/ibcInspecao.utils";
import { toError } from "../utils/toError";
import CadastroIbcSectionError from "./CadastroIbcSectionError";
import CadastroIbcSectionSkeleton from "./CadastroIbcSectionSkeleton";

type Props = {
  ibc: IbcCadastroDTO;
  onClose: () => void;
};

export default function IbcInspecoesDrawer({ ibc, onClose }: Props) {
  const query = useIbcInspecoes(ibc.id);
  const inspecoes = query.data ?? [];

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Inspeções de {ibc.identificador}</DialogTitle>
          <DialogDescription>
            Mais recente primeiro, com os limites e itens do momento da inspeção.
          </DialogDescription>
        </DialogHeader>

        {query.isLoading ? (
          <CadastroIbcSectionSkeleton rows={2} />
        ) : query.error ? (
          <CadastroIbcSectionError message={toError(query.error).message} onRetry={() => void query.refetch()} />
        ) : inspecoes.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma inspeção registrada para este IBC.</p>
        ) : (
          <ol className="max-h-[28rem] space-y-3 overflow-auto">
            {inspecoes.map((inspecao) => (
              <InspecaoItem key={inspecao.id} inspecao={inspecao} />
            ))}
          </ol>
        )}
      </DialogContent>
    </Dialog>
  );
}

function InspecaoItem({ inspecao }: { inspecao: IbcInspecaoHistoricoDTO }) {
  const reprovada = inspecao.resultado === "REPROVADA";
  return (
    <li className={cn("rounded-md border px-3 py-2 text-sm", reprovada && "border-destructive/40")}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-medium">{inspecao.checklistNome}</span>
        <Badge variant={reprovada ? "destructive" : "secondary"} className="text-[10px]">
          {ibcCadastroLabels.inspecaoResultado[inspecao.resultado]}
        </Badge>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {formatMediaVsMinima(inspecao.mediaObtida, inspecao.mediaMinima)}
        {" · crítico mín. "}
        {formatNotaInspecao(inspecao.notaMinimaCritico)}
      </p>
      <ul className="mt-2 divide-y divide-border rounded-md border">
        {inspecao.respostas.map((resposta) => {
          const abaixo = isNotaAbaixoDoMinimo(resposta, inspecao);
          return (
            <li key={resposta.checklistItemId} className="flex items-center justify-between gap-3 px-2 py-1">
              <span className="flex min-w-0 flex-wrap items-center gap-2">
                <span className="break-words">{resposta.descricao}</span>
                {resposta.critico ? (
                  <Badge variant="outline" className="text-[10px]">Crítico</Badge>
                ) : null}
              </span>
              <span className={cn("shrink-0 tabular-nums", abaixo && "font-medium text-destructive")}>
                {formatNotaInspecao(resposta.nota)}
                {abaixo ? ` (mín. ${formatNotaInspecao(notaMinimaDoItem(resposta, inspecao))})` : null}
              </span>
            </li>
          );
        })}
      </ul>
      {inspecao.observacao ? (
        <p className="mt-2 text-muted-foreground">“{inspecao.observacao}”</p>
      ) : null}
      <p className="mt-1 text-xs text-muted-foreground">
        {formatIsoDateTimeLabel(inspecao.inspecionadoEm)}
        {" · "}
        {inspecao.inspetor.nome}
      </p>
    </li>
  );
}
