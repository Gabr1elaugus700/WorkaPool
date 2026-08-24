import clsx from "clsx";

type Props = {
  alocado: number;
  esperado: number;
  className?: string;
};

/**
 * Progresso de alocação IBC (ex.: 2/3).
 */
export default function PedidoIbcProgress({
  alocado,
  esperado,
  className,
}: Props) {
  const completo = esperado > 0 && alocado >= esperado;
  const parcial = alocado > 0 && !completo;

  return (
    <span
      className={clsx(
        "text-sm font-semibold tabular-nums",
        completo && "text-emerald-700",
        parcial && "text-amber-700",
        !completo && !parcial && "text-muted-foreground",
        className,
      )}
    >
      {alocado}/{esperado}
    </span>
  );
}
