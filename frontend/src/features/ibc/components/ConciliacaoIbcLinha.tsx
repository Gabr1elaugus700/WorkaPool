import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ConciliacaoViagemItemDTO, DestinoConciliacao, PedidoConciliacaoDTO } from "../types/conciliacaoViagem.types";
import IbcSegmentedControl from "./IbcSegmentedControl";

const DESTINOS: Array<{ id: DestinoConciliacao; label: string }> = [
  { id: "FICOU", label: "Ficou no cliente" },
  { id: "RETORNOU", label: "Retornou no caminhão" },
  { id: "TROCA", label: "Troca" },
];

type Props = {
  item: ConciliacaoViagemItemDTO;
  pedidos: readonly PedidoConciliacaoDTO[];
  disabled: boolean;
  onDestino: (destino: DestinoConciliacao) => void;
  onPedido: (numPed: string) => void;
  onTroca?: () => void;
};

export default function ConciliacaoIbcLinha({ item, pedidos, disabled, onDestino, onPedido, onTroca }: Props) {
  const pedePedido = item.destino === "FICOU" || item.destino === "TROCA";
  const pedido = pedePedido ? pedidos.find((atual) => atual.numPed === item.numPed) ?? null : null;
  return (
    <article className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <h3 className="text-lg font-semibold text-foreground">{item.identificador}</h3>
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
        {pedePedido ? (
          <div className="min-w-0">
            <label className="mb-1.5 flex items-center gap-2 text-xs font-medium text-foreground" htmlFor={`pedido-${item.alocacaoIbcId}`}>
              Pedido
              {pedido?.incluso ? <Badge variant="secondary">Incluso</Badge> : null}
            </label>
            <select
              id={`pedido-${item.alocacaoIbcId}`}
              className="h-10 w-full max-w-xs rounded-md border border-border bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={disabled}
              value={item.numPed ?? ""}
              onChange={(event) => {
                if (event.target.value) onPedido(event.target.value);
              }}
            >
              <option value="" disabled>Escolha o pedido</option>
              {pedidos.map((opcao) => (
                <option key={opcao.numPed} value={opcao.numPed}>
                  {opcao.numPed} · {opcao.cliente}
                </option>
              ))}
            </select>
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
