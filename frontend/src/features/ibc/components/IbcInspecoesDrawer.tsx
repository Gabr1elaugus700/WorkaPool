import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Inspeções de {ibc.identificador}</SheetTitle>
          <SheetDescription>Mais recente primeiro, com os limites e itens do momento da inspeção.</SheetDescription>
        </SheetHeader>
        <SheetBody>
          {query.isLoading ? (
            <CadastroIbcSectionSkeleton rows={3} />
          ) : query.error ? (
            <CadastroIbcSectionError message={toError(query.error).message} onRetry={() => void query.refetch()} />
          ) : inspecoes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma inspeção registrada para este IBC.</p>
          ) : (
            <ol className="space-y-6">
              {inspecoes.map((inspecao) => (
                <InspecaoItem key={inspecao.id} inspecao={inspecao} />
              ))}
            </ol>
          )}
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}

function InspecaoItem({ inspecao }: { inspecao: IbcInspecaoHistoricoDTO }) {
  const reprovada = inspecao.resultado === "REPROVADA";
  return (
    <li className="space-y-2 text-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <p className="font-medium text-foreground">{inspecao.checklistNome}</p>
        <Badge variant={reprovada ? "destructive" : "secondary"}>
          {ibcCadastroLabels.inspecaoResultado[inspecao.resultado]}
        </Badge>
      </div>
      <p className="text-xs text-muted-foreground">
        {formatIsoDateTimeLabel(inspecao.inspecionadoEm)} · {inspecao.inspetor.nome}
      </p>
      <p className="text-xs text-muted-foreground">
        {formatMediaVsMinima(inspecao.mediaObtida, inspecao.mediaMinima)} · crítico mín.{" "}
        {formatNotaInspecao(inspecao.notaMinimaCritico)}
      </p>
      <ul className={cn("divide-y divide-border rounded-md border", reprovada && "border-destructive/40")}>
        {inspecao.respostas.map((resposta) => {
          const abaixo = isNotaAbaixoDoMinimo(resposta, inspecao);
          return (
            <li key={resposta.checklistItemId} className="flex items-center justify-between gap-3 px-3 py-1.5">
              <span className="flex min-w-0 flex-wrap items-center gap-2">
                <span className="break-words">{resposta.descricao}</span>
                {resposta.critico ? (
                  <span className="text-xs font-medium text-muted-foreground">Crítico</span>
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
      {inspecao.observacao ? <p className="text-muted-foreground">“{inspecao.observacao}”</p> : null}
    </li>
  );
}
