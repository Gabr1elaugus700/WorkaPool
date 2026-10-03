import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Histórico de {identificador}</DialogTitle>
          <DialogDescription>
            Conversões e mudanças de produto com origem e destino.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <CadastroIbcSectionSkeleton rows={2} />
        ) : errorMessage ? (
          <CadastroIbcSectionError message={errorMessage} onRetry={onRetry} />
        ) : eventos.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma conversão ou mudança registrada para este IBC.
          </p>
        ) : (
          <ol className="max-h-96 space-y-3 overflow-auto">
            {eventos.map((evento) => (
              <li key={evento.id} className="rounded-md border px-3 py-2 text-sm">
                <p className="font-medium">
                  {ibcCadastroLabels.mudanca[evento.changeType]}
                </p>
                <p className="mt-1">
                  {evento.from.identificador} → {evento.to.identificador}
                </p>
                {evento.observation ? (
                  <p className="mt-1 text-muted-foreground">“{evento.observation}”</p>
                ) : null}
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatIsoDateTimeLabel(evento.createdAt)}
                  {" · "}
                  {evento.actorName ?? "Usuário não identificado"}
                </p>
              </li>
            ))}
          </ol>
        )}
      </DialogContent>
    </Dialog>
  );
}
