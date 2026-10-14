import { formatNumber } from "@/utils/formatNumber";
import type { BucketConsultaConciliacaoErp, RelatorioConciliacaoErp } from "../types/conciliacaoErp.types";
import { conciliacaoErpApresentacao } from "../utils/conciliacaoErp.utils";

type Props = {
  relatorio: RelatorioConciliacaoErp;
  ativo?: BucketConsultaConciliacaoErp;
  onSelecionar: (bucket: BucketConsultaConciliacaoErp) => void;
};

const superficie = "rounded-lg border bg-card p-4 text-left shadow-sm";

export default function ConciliacaoErpPainel({ relatorio, ativo, onSelecionar }: Props) {
  const contagem = new Map(relatorio.buckets.map((item) => [item.bucket, item]));
  const metricas = [
    ["Saldo ERP", conciliacaoErpApresentacao.saldo(relatorio.saldoErp)],
    ["Vivos no WorkaPool", formatNumber(relatorio.vivosWp)],
    ["Gap residual (ERP − vivos)", conciliacaoErpApresentacao.residual(relatorio.residual)],
  ] as const;

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-3">
        {metricas.map(([rotulo, valor]) => (
          <div key={rotulo} className={`${superficie} border-border`}>
            <p className="text-xs font-medium text-muted-foreground">{rotulo}</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">{valor}</p>
          </div>
        ))}
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {conciliacaoErpApresentacao.buckets.map((bucket) => {
          const ciclo = bucket === "SERIAL_SEM_NF" ? undefined : contagem.get(bucket);
          const total = bucket === "SERIAL_SEM_NF" ? relatorio.serialSemNf.count : (ciclo?.count ?? 0);
          const selecionado = ativo === bucket;
          const borda = selecionado ? "border-primary ring-2 ring-primary" : "border-border";
          return (
            <button
              key={bucket}
              type="button"
              aria-pressed={selecionado}
              onClick={() => onSelecionar(bucket)}
              className={`${superficie} hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${borda}`}
            >
              <span className="block text-sm font-medium text-foreground">{conciliacaoErpApresentacao.rotuloBucket(bucket)}</span>
              <span className="mt-1 block text-xl font-bold tabular-nums text-foreground">{formatNumber(total)}</span>
              {ciclo?.entraNaSoma === true ? null : (
                <span className="mt-1 block text-xs text-muted-foreground">não entra na soma</span>
              )}
            </button>
          );
        })}
        <div className={`${superficie} border-border`} data-recorte="nf-sem-serializar">
          <p className="text-sm font-medium text-foreground">NF sem serializar</p>
          <p className="mt-1 text-xl font-bold text-foreground">indisponível</p>
          <p className="mt-1 text-xs text-muted-foreground">não entra na soma</p>
        </div>
      </div>
    </>
  );
}
