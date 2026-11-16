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
import type { IbcInspecaoHistoricoDTO, IbcInspecaoRespostaDTO } from "../types/ibcInspecao.types";
import { ibcCadastroLabels } from "../utils/ibcCadastroLabels";
import {
  formatLimitesInspecaoHistorico,
  formatMediaVsMinima,
  formatNotaInspecao,
  formatRespostaInspecaoHistorico,
  isRespostaNumericaAbaixoDoMinimo,
  notaMinimaDoItem,
  simNaoBloqueanteForaDoEsperado,
} from "../utils/ibcInspecao.utils";
import { toError } from "../utils/toError";
import CadastroIbcSectionError from "./CadastroIbcSectionError";
import CadastroIbcSectionSkeleton from "./CadastroIbcSectionSkeleton";

type IbcConsultado = Pick<IbcCadastroDTO, "id" | "identificador">;

type Props = {
  open: boolean;
  ibc: IbcConsultado | null;
  onClose: () => void;
};

export default function IbcInspecoesDrawer({ open, ibc, onClose }: Props) {
  return (
    <Sheet open={open && ibc != null} onOpenChange={(next) => !next && onClose()}>
      <SheetContent>{ibc ? <InspecoesConteudo key={ibc.id} ibc={ibc} /> : null}</SheetContent>
    </Sheet>
  );
}

function InspecoesConteudo({ ibc }: { ibc: IbcConsultado }) {
  const query = useIbcInspecoes(ibc.id);
  const inspecoes = query.data ?? [];

  return (
    <>
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
    </>
  );
}

function InspecaoItem({ inspecao }: { inspecao: IbcInspecaoHistoricoDTO }) {
  const reprovada = inspecao.resultado === "REPROVADA";
  const limitesTexto = formatLimitesInspecaoHistorico(inspecao);
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
        {formatMediaVsMinima(inspecao.mediaObtida, inspecao.mediaMinima)}
        {limitesTexto ? ` · ${limitesTexto}` : null}
      </p>
      <ul className={cn("divide-y divide-border rounded-md border", reprovada && "border-destructive/40")}>
        {inspecao.respostas.map((resposta) => (
          <RespostaHistoricoItem key={resposta.checklistItemId} resposta={resposta} inspecao={inspecao} />
        ))}
      </ul>
      {inspecao.observacao ? <p className="text-muted-foreground">“{inspecao.observacao}”</p> : null}
    </li>
  );
}

function RespostaHistoricoItem({
  resposta,
  inspecao,
}: {
  resposta: IbcInspecaoRespostaDTO;
  inspecao: IbcInspecaoHistoricoDTO;
}) {
  const abaixo = isRespostaNumericaAbaixoDoMinimo(resposta, inspecao);
  const simNaoFora = simNaoBloqueanteForaDoEsperado(resposta);
  const destacar = abaixo || simNaoFora;

  return (
    <li className="space-y-1 px-3 py-2">
      <div className="flex items-start justify-between gap-3">
        <span className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="break-words">{resposta.descricao}</span>
          {resposta.tipo === "NUMERICO" && resposta.critico ? (
            <span className="text-xs font-medium text-muted-foreground">Crítico</span>
          ) : null}
        </span>
        <span className={cn("shrink-0 text-right text-sm tabular-nums", destacar && "font-medium text-destructive")}>
          {formatRespostaInspecaoHistorico(resposta)}
          {abaixo
            ? ` (mín. ${formatNotaInspecao(notaMinimaDoItem(resposta, inspecao))})`
            : null}
        </span>
      </div>
      {resposta.observacao ? (
        <p className="text-xs text-muted-foreground">Obs. item: “{resposta.observacao}”</p>
      ) : null}
    </li>
  );
}