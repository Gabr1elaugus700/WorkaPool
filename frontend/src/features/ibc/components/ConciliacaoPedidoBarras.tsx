import type { PedidoConciliacaoDTO } from "../types/conciliacaoViagem.types";

type Props = {
  pedidos: readonly PedidoConciliacaoDTO[];
};

export default function ConciliacaoPedidoBarras({ pedidos }: Props) {
  if (pedidos.length === 0) return null;
  return (
    <section className="mb-6" aria-label="Progresso por pedido">
      <h2 className="text-lg font-semibold text-foreground">Por pedido</h2>
      <ul className="mt-3 flex flex-col gap-3">
        {pedidos.map((pedido) => {
          const teto = Math.max(pedido.quantidadeEsperada, 1);
          const pct = Math.min(100, Math.round((pedido.quantidadeApontada / teto) * 100));
          const fechou = pedido.quantidadeApontada === pedido.quantidadeEsperada;
          return (
            <li key={pedido.numPed}>
              <div className="mb-1.5 flex items-baseline justify-between gap-3">
                <p className="min-w-0 truncate text-sm font-medium text-foreground">
                  Pedido {pedido.numPed}
                  <span className="font-normal text-muted-foreground"> · {pedido.cliente}</span>
                </p>
                <p className="shrink-0 tabular-nums text-sm text-foreground">
                  {pedido.quantidadeApontada} de {pedido.quantidadeEsperada}
                </p>
              </div>
              <div
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={pedido.quantidadeEsperada}
                aria-valuenow={Math.min(pedido.quantidadeApontada, pedido.quantidadeEsperada)}
                aria-label={`Pedido ${pedido.numPed}, ${pedido.quantidadeApontada} de ${pedido.quantidadeEsperada}`}
                className="h-2 overflow-hidden rounded-full bg-secondary"
              >
                <div
                  className={`h-full rounded-full transition-[width] duration-200 ease-out ${fechou ? "bg-primary" : "bg-foreground/40"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
