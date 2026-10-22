import { CheckCircle2 } from "lucide-react";
import type { CreateLoteIbcResultDTO, IbcCadastroDTO } from "../types/ibcCadastro.types";
import CadastroIbcLoteWarningBanner from "./CadastroIbcLoteWarningBanner";

type Props =
  | { modo: "unitario"; ibc: IbcCadastroDTO }
  | { modo: "lote"; result: CreateLoteIbcResultDTO };

export default function CadastroIbcResultado(props: Props) {
  const identificadores =
    props.modo === "unitario" ? [props.ibc.identificador] : props.result.items.map((item) => item.identificador);
  const titulo =
    props.modo === "unitario"
      ? "IBC cadastrado"
      : `Lote cadastrado: ${props.result.items.length} IBCs${props.result.lote.numeroNf ? ` · NF ${props.result.lote.numeroNf}` : ""}`;

  return (
    <div className="space-y-2">
      <div role="status" className="rounded-md border border-primary/30 bg-primary/5 px-3 py-2.5 text-sm">
        <p className="flex items-center gap-2 font-medium text-foreground">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" aria-hidden />
          {titulo}
        </p>
        <ul className="mt-2 flex flex-wrap gap-1.5 pl-6">
          {identificadores.map((identificador) => (
            <li
              key={identificador}
              className="rounded border border-border bg-card px-1.5 py-0.5 text-xs font-medium tabular-nums text-foreground"
            >
              {identificador}
            </li>
          ))}
        </ul>
      </div>
      {props.modo === "lote" && props.result.warning ? (
        <CadastroIbcLoteWarningBanner warning={props.result.warning} />
      ) : null}
    </div>
  );
}
