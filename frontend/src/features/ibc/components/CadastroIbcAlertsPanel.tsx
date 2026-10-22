import { AlertTriangle, CheckCircle2, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { IbcAlertDTO } from "../types/ibcCadastro.types";
import { IBC_ALERTA_MOTIVOS_DESTRUTIVOS, ibcCadastroLabels } from "../utils/ibcCadastroLabels";
import IbcAlertaReprovacaoDetalhes from "./IbcAlertaReprovacaoDetalhes";

type Props = {
  alerts: IbcAlertDTO[];
};

function resumoAlertas(alerts: IbcAlertDTO[]): string {
  const counts = new Map<IbcAlertDTO["motivo"], number>();
  for (const alert of alerts) counts.set(alert.motivo, (counts.get(alert.motivo) ?? 0) + 1);
  return [...counts.entries()]
    .map(([motivo, count]) => `${count} ${ibcCadastroLabels.alertaMotivo[motivo].toLowerCase()}`)
    .join(" · ");
}

export default function CadastroIbcAlertsPanel({ alerts }: Props) {
  if (alerts.length === 0) {
    return (
      <p className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm text-muted-foreground shadow-sm">
        <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden />
        Nenhum alerta de IBC.
      </p>
    );
  }

  const destrutivo = alerts.some((alert) => IBC_ALERTA_MOTIVOS_DESTRUTIVOS.has(alert.motivo));

  return (
    <details
      className={cn(
        "group rounded-lg border bg-card text-sm shadow-sm",
        destrutivo ? "border-destructive/40" : "border-border",
      )}
    >
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-lg px-4 py-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 [&::-webkit-details-marker]:hidden">
        <AlertTriangle
          className={cn("h-4 w-4 shrink-0", destrutivo ? "text-destructive" : "text-amber-600")}
          aria-hidden
        />
        <span className="font-medium tabular-nums">
          {alerts.length === 1 ? "1 alerta" : `${alerts.length} alertas`}
        </span>
        <span className="min-w-0 truncate text-muted-foreground">{resumoAlertas(alerts)}</span>
        <ChevronDown
          className="ml-auto h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180"
          aria-hidden
        />
      </summary>
      <ul className="max-h-80 divide-y divide-border overflow-y-auto border-t">
        {alerts.map((alert) => {
          const isDestrutivo = IBC_ALERTA_MOTIVOS_DESTRUTIVOS.has(alert.motivo);
          return (
            <li
              key={`${alert.identificador}-${alert.motivo}`}
              className={cn("px-4 py-2", isDestrutivo && "bg-destructive/5")}
            >
              <span className="font-medium tabular-nums">{alert.identificador}</span>
              <span className={isDestrutivo ? "text-destructive" : "text-muted-foreground"}>
                {" · "}
                {ibcCadastroLabels.alertaMotivo[alert.motivo]}
              </span>
              {alert.detalhes ? <IbcAlertaReprovacaoDetalhes detalhes={alert.detalhes} /> : null}
            </li>
          );
        })}
      </ul>
    </details>
  );
}
