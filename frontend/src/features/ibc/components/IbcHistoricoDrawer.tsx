import { ArrowRight } from "lucide-react";
import { SheetBody, SheetHeader } from "@/components/ui/sheet";
import { formatIsoDateTimeLabel } from "@/utils/formatDate";
import type { IbcHistoricoDTO } from "../types/ibcCadastro.types";
import { ibcCadastroLabels } from "../utils/ibcCadastroLabels";
import { corDePlaca } from "../utils/ibcMudanca.utils";
import CadastroIbcSectionError from "./CadastroIbcSectionError";
import CadastroIbcSectionSkeleton from "./CadastroIbcSectionSkeleton";

type Props = {
  identificador: string;
  eventos: IbcHistoricoDTO[];
  isLoading: boolean;
  errorMessage: string | null;
  onRetry: () => void;
};

export default function IbcHistoricoDrawer({
  identificador,
  eventos,
  isLoading,
  errorMessage,
  onRetry,
}: Props) {
  return (
    <>
      <SheetHeader>
        <h2 id="ibc-historico-titulo" className="text-lg font-semibold leading-tight text-foreground">Histórico de {identificador}</h2>
        <p id="ibc-historico-descricao" className="text-sm text-muted-foreground">Conversões e mudanças de produto, da mais recente para a mais antiga.</p>
      </SheetHeader>
        <SheetBody>
          {isLoading ? (
            <CadastroIbcSectionSkeleton rows={3} />
          ) : errorMessage ? (
            <CadastroIbcSectionError message={errorMessage} onRetry={onRetry} />
          ) : eventos.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma conversão ou mudança registrada para este IBC.</p>
          ) : (
            <ol className="divide-y divide-border rounded-md border">
              {eventos.map((evento) => (
                <li key={evento.id} className="space-y-1 px-3 py-3 text-sm">
                  <p className="font-medium text-foreground">{ibcCadastroLabels.mudanca[evento.changeType]}</p>
                  <p className="flex flex-wrap items-center gap-x-3 gap-y-2">
                    <Placa identificador={evento.identificadorAnterior ?? evento.from.identificador} cor={evento.corAnterior} />
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" aria-label="para" />
                    <Placa identificador={evento.identificadorNovo ?? evento.to.identificador} cor={evento.corNova} />
                  </p>
                  {evento.observation ? <p className="text-muted-foreground">“{evento.observation}”</p> : null}
                  <p className="text-xs text-muted-foreground">
                    {formatIsoDateTimeLabel(evento.createdAt)} · {evento.actorName ?? "Usuário não identificado"}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </SheetBody>
    </>
  );
}

function Placa({ identificador, cor }: { identificador: string; cor: string | null }) {
  const amostra = corDePlaca(cor);
  return (
    <span className="inline-flex min-w-0 items-center gap-2">
      <span className="inline-block h-4 w-6 shrink-0 rounded-sm border border-border shadow-sm" style={{ backgroundColor: amostra ?? "transparent" }} role="img" aria-label={amostra ? `Cor ${amostra}` : "Cor não registrada"} />
      <span className="min-w-0">
        <span className="block font-medium tabular-nums text-foreground">{identificador}</span>
        <span className="block text-xs text-muted-foreground">{amostra ?? "Cor não registrada"}</span>
      </span>
    </span>
  );
}
