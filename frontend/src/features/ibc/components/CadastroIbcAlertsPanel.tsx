import { cn } from "@/lib/utils";
import type { IbcAlertDTO } from "../types/ibcCadastro.types";
import { ibcCadastroLabels } from "../utils/ibcCadastroLabels";

type Props = {
  alerts: IbcAlertDTO[];
};

export default function CadastroIbcAlertsPanel({ alerts }: Props) {
  if (alerts.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Nenhum alerta de IBC.</p>
    );
  }

  return (
    <ul className="space-y-2">
      {alerts.map((alert) => {
        const isDataLimite = alert.motivo === "DATA_LIMITE";
        return (
          <li
            key={`${alert.identificador}-${alert.motivo}`}
            className={cn(
              "rounded-md border px-3 py-2 text-sm",
              isDataLimite
                ? "border-destructive/40 bg-destructive/5"
                : "border-border bg-background"
            )}
          >
            <span className="font-medium">{alert.identificador}</span>
            <span className="text-muted-foreground">
              {" — "}
              {ibcCadastroLabels.motivoInaptidao[alert.motivo]}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
