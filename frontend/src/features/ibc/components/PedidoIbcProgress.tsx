import clsx from "clsx";

type TomProgresso = "semaforo" | "preparacao";

type Props = {
  alocado: number;
  esperado: number;
  tom?: TomProgresso;
  className?: string;
};

function corSemaforo(completo: boolean, parcial: boolean): string {
  if (completo) return "text-emerald-700";
  if (parcial) return "text-amber-700";
  return "text-muted-foreground";
}

/**
 * Progresso de alocação IBC (ex.: 2/3).
 * `semaforo` colore a lista de cargas. `preparacao` deixa 0 muted e o restante em foreground.
 */
export default function PedidoIbcProgress({
  alocado,
  esperado,
  tom = "semaforo",
  className,
}: Props) {
  const completo = esperado > 0 && alocado >= esperado;
  const parcial = alocado > 0 && !completo;
  const cor = tom === "preparacao"
    ? (alocado > 0 ? "text-foreground" : "text-muted-foreground")
    : corSemaforo(completo, parcial);

  return (
    <span
      className={clsx(
        "text-sm font-semibold tabular-nums",
        cor,
        className,
      )}
    >
      {alocado}/{esperado}
    </span>
  );
}
