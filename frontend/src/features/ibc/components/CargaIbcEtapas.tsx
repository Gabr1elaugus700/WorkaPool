import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CargaIbcEtapaItem } from "../utils/cargaIbcEtapa";
import { expedicaoIbcStationTone } from "../utils/expedicaoIbcSections";

type Props = {
  etapas: readonly CargaIbcEtapaItem[];
};

function EtapaConteudo({ etapa, numero }: { etapa: CargaIbcEtapaItem; numero: number }) {
  const tone = expedicaoIbcStationTone[etapa.station];
  const apagada = etapa.estado === "futura" && !etapa.selecionada;
  return (
    <>
      <span className={cn("h-1 rounded-full", apagada ? "bg-border" : tone.stripeClass)} aria-hidden />
      <span className="flex items-center gap-2">
        <span
          className={cn(
            "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold tabular-nums",
            apagada ? "border-border bg-background text-muted-foreground" : tone.badgeClass,
          )}
          aria-hidden
        >
          {etapa.estado === "concluida" ? <Check className="h-3.5 w-3.5" /> : numero}
        </span>
        <span
          className={cn(
            "text-sm",
            etapa.selecionada ? "font-semibold text-foreground" : "text-muted-foreground group-hover:text-foreground",
          )}
        >
          {etapa.label}
        </span>
        {etapa.estado === "concluida" ? <span className="sr-only">(concluída)</span> : null}
      </span>
    </>
  );
}

export default function CargaIbcEtapas({ etapas }: Props) {
  return (
    <nav aria-label="Etapas da carga" className="mb-6">
      <ol className="grid grid-cols-3 gap-3">
        {etapas.map((etapa, indice) => (
          <li key={etapa.id}>
            {etapa.to != null && !etapa.selecionada ? (
              <Link
                to={etapa.to}
                className="group flex flex-col gap-2 rounded-sm pb-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <EtapaConteudo etapa={etapa} numero={indice + 1} />
              </Link>
            ) : (
              <span
                className="flex flex-col gap-2 pb-1"
                aria-current={etapa.selecionada ? "step" : undefined}
                aria-disabled={etapa.to == null ? true : undefined}
              >
                <EtapaConteudo etapa={etapa} numero={indice + 1} />
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
