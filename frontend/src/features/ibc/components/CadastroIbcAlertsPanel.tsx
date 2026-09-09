import type { IbcAlertDTO } from "../types/ibcCadastro.types";

type Props = {
  alerts: IbcAlertDTO[];
};

const MOTIVO_LABEL: Record<IbcAlertDTO["motivo"], string> = {
  AGUARDANDO_INSPECAO: "Aguardando inspeção",
  DATA_LIMITE: "Data limite",
};

export default function CadastroIbcAlertsPanel({ alerts }: Props) {
  if (alerts.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Nenhum alerta de IBC.</p>
    );
  }

  return (
    <ul className="space-y-2">
      {alerts.map((alert) => (
        <li
          key={`${alert.identificador}-${alert.motivo}`}
          className="rounded-md border border-border px-3 py-2 text-sm"
        >
          <span className="font-medium">{alert.identificador}</span>
          <span className="text-muted-foreground">
            {" — "}
            {MOTIVO_LABEL[alert.motivo]}
          </span>
        </li>
      ))}
    </ul>
  );
}
