import { ArrowRight } from "lucide-react";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatIsoDateTimeLabel } from "@/utils/formatDate";
import type { IbcHistoricoDTO } from "../types/ibcCadastro.types";
import { ibcCadastroLabels } from "../utils/ibcCadastroLabels";
import CadastroIbcSectionError from "./CadastroIbcSectionError";
import CadastroIbcSectionSkeleton from "./CadastroIbcSectionSkeleton";

type Props = {
  identificador: string;
  eventos: IbcHistoricoDTO[];
  isLoading: boolean;
  errorMessage: string | null;
  onRetry: () => void;
  onClose: () => void;
};

export default function IbcHistoricoDrawer({
  identificador,
  eventos,
  isLoading,
  errorMessage,
  onRetry,
  onClose,
}: Props) {
  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Histórico de {identificador}</SheetTitle>
          <SheetDescription>Conversões e mudanças de produto, da mais recente para a mais antiga.</SheetDescription>
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
                  <p className="flex flex-wrap items-center gap-1.5 tabular-nums">
                    <span>{evento.from.identificador}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" aria-label="para" />
                    <span className="font-medium">{evento.to.identificador}</span>
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
      </SheetContent>
    </Sheet>
  );
}
