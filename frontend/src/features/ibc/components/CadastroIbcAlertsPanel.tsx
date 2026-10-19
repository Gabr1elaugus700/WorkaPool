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
      <p className="rounded-md border border-border bg-card px-3 py-2 text-sm text-muted-foreground shadow-sm">
        Nenhum alerta de IBC.
      </p>
    );
  }

  const destrutivo = alerts.some((alert) => IBC_ALERTA_MOTIVOS_DESTRUTIVOS.has(alert.motivo));

  return (
    <details
      className={cn(
        "rounded-md border bg-card px-3 py-2 text-sm shadow-sm",
        destrutivo ? "border-destructive/40" : "border-border",
      )}
    >
      <summary className="cursor-pointer font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
        {alerts.length === 1 ? "1 alerta" : `${alerts.length} alertas`}
        <span className="font-normal text-muted-foreground"> · {resumoAlertas(alerts)}</span>
      </summary>
      <ul className="mt-2 space-y-2">
      {alerts.map((alert) => {
        const isDestrutivo = IBC_ALERTA_MOTIVOS_DESTRUTIVOS.has(alert.motivo);
        return (
          <li
            key={`${alert.identificador}-${alert.motivo}`}
            className={cn(
              "rounded-md border px-3 py-2 text-sm",
              isDestrutivo
                ? "border-destructive/40 bg-destructive/5"
                : "border-border bg-background"
            )}
          >
            <span className="font-medium">{alert.identificador}</span>
            <span className="text-muted-foreground">
              {" — "}
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
