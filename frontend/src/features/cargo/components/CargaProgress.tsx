import { Progress } from "@/components/ui/progress";
import clsx from "clsx";

type Props = {
  pesoAtual: number;
  pesoMaximo: number;
};

/**
 * Componente que exibe o progresso de capacidade de uma carga
 * Mostra barra de progresso visual com cores condicionais baseadas no percentual
 */
export default function CargaProgress({ pesoAtual, pesoMaximo }: Props) {
  const percentual = pesoMaximo > 0 ? (pesoAtual / pesoMaximo) * 100 : 0;

  // Define cor baseada no percentual
  const getColorClass = () => {
    if (percentual >= 90) return "text-red-600";
    if (percentual >= 70) return "text-yellow-600";
    return "text-green-600";
  };

  const getProgressColor = () => {
    if (percentual >= 90) return "bg-red-500";
    if (percentual >= 70) return "bg-yellow-500";
    return "bg-green-500";
  };

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center text-xs">
        <span className="text-muted-foreground">
          Capacidade utilizada:{" "}
          <span className={clsx("font-semibold", getColorClass())}>
            {percentual.toFixed(1)}%
          </span>
        </span>
        <span className="text-muted-foreground">
          {pesoAtual.toLocaleString("pt-BR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}{" "}
          / {pesoMaximo} kg
        </span>
      </div>
      
      <div className="relative">
        <Progress value={percentual} className="h-2" />
        {/* Overlay colorido na progress bar */}
        <div
          className={clsx(
            "absolute top-0 left-0 h-2 rounded-full transition-all",
            getProgressColor()
          )}
          style={{ width: `${Math.min(percentual, 100)}%` }}
        />
      </div>
    </div>
  );
}
