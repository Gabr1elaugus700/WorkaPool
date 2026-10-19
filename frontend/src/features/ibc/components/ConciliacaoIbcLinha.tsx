import { Button } from "@/components/ui/button";
import type { ConciliacaoViagemItemDTO, DestinoConciliacao, ModalidadeConciliacao } from "../types/conciliacaoViagem.types";
import IbcSegmentedControl from "./IbcSegmentedControl";
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
  onTroca?: () => void;
};
export default function ConciliacaoIbcLinha({ item, disabled, onDestino, onModalidade, onTroca }: Props) {
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
      <div className="mt-3 flex flex-wrap items-start gap-x-6 gap-y-3">
        <div>
          <p className="mb-1.5 text-xs font-medium text-foreground">Destino neste retorno</p>
          <IbcSegmentedControl
            ariaLabel={`Destino de ${item.identificador}`}
            options={DESTINOS}
            value={item.destino}
            disabled={disabled}
            onChange={onDestino}
          />
        </div>
        {item.destino === "FICOU" ? (
          <div>
            <p className="mb-1.5 text-xs font-medium text-foreground">Como ficou no cliente</p>
            <IbcSegmentedControl
              ariaLabel={`Modalidade de ${item.identificador}`}
              options={MODALIDADES}
              value={item.modalidade}
              disabled={disabled}
              onChange={onModalidade}
            />
            {item.modalidade == null ? (
              <p className="mt-2 text-xs text-muted-foreground">
                {sugestao == null
                  ? "O pedido mistura venda e empréstimo. Escolha uma."
                  : "Confirme a modalidade sugerida pelo pedido."}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
      {item.destino === "TROCA" ? (
        item.ibcEntradaId ? (
          <p className="mt-3 text-sm text-muted-foreground">Entrada da troca vinculada.</p>
        ) : (
          <Button type="button" size="sm" className="mt-3" variant="outline" disabled={disabled || !onTroca} onClick={onTroca}>
            Registrar o IBC que entrou
          </Button>
        )
      ) : null}
    </article>
  );
}
