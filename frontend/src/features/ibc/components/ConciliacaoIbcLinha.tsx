import { Button } from "@/components/ui/button";
import type { ConciliacaoViagemItemDTO, DestinoConciliacao, ModalidadeConciliacao } from "../types/conciliacaoViagem.types";
const DESTINOS: Array<{ id: DestinoConciliacao; label: string }> = [
  { id: "FICOU", label: "Ficou no cliente" },
  { id: "RETORNOU", label: "Retornou no caminhão" },
  { id: "TROCA", label: "Troca" },
];
const MODALIDADES: Array<{ id: ModalidadeConciliacao; label: string }> = [
  { id: "VENDA", label: "Venda" },
  { id: "EMPRESTIMO", label: "Empréstimo" },
];
type Props = {
  item: ConciliacaoViagemItemDTO;
  disabled: boolean;
  onDestino: (destino: DestinoConciliacao) => void;
  onModalidade: (modalidade: ModalidadeConciliacao) => void;
};
export default function ConciliacaoIbcLinha({ item, disabled, onDestino, onModalidade }: Props) {
  const sugestao = item.destino === "FICOU" && item.modalidade == null ? item.modalidadeSugerida : null;
  return (
    <article className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold text-foreground">{item.identificador}</h2>
        <p className="text-sm text-muted-foreground">
          {item.cliente || "Cliente não identificado"}
          {item.numPed ? ` · pedido ${item.numPed}` : ""}
        </p>
      </div>
      <fieldset className="mt-3" disabled={disabled}>
        <legend className="text-xs font-medium text-foreground">Destino neste retorno</legend>
        <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label={`Destino de ${item.identificador}`}>
          {DESTINOS.map((destino) => (
            <Button
              key={destino.id}
              type="button"
              size="sm"
              variant={item.destino === destino.id ? "default" : "outline"}
              aria-pressed={item.destino === destino.id}
              onClick={() => onDestino(destino.id)}
            >
              {destino.label}
            </Button>
          ))}
        </div>
      </fieldset>
      {item.destino === "FICOU" ? (
        <fieldset className="mt-3" disabled={disabled}>
          <legend className="text-xs font-medium text-foreground">Como ficou no cliente</legend>
          <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label={`Modalidade de ${item.identificador}`}>
            {MODALIDADES.map((modalidade) => (
              <Button
                key={modalidade.id}
                type="button"
                size="sm"
                variant={item.modalidade === modalidade.id ? "default" : "outline"}
                aria-pressed={item.modalidade === modalidade.id}
                onClick={() => onModalidade(modalidade.id)}
              >
                {modalidade.label}
              </Button>
            ))}
          </div>
          {item.modalidade == null ? (
            <p className="mt-2 text-xs text-muted-foreground">
              {sugestao == null
                ? "O pedido mistura venda e empréstimo. Escolha uma."
                : "Confirme a modalidade sugerida pelo pedido."}
            </p>
          ) : null}
        </fieldset>
      ) : null}
    </article>
  );
}
