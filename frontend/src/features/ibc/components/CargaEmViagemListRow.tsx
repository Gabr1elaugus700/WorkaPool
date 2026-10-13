import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatIsoDayMonthTimeLabel } from "@/utils/formatDate";
import ExportarRelatorioViagemButton from "./ExportarRelatorioViagemButton";
import type { CargaEmViagemListItemDTO } from "../types/ibcExpedicao.types";

const VISIBLE_CLIENTES = 3;

type Props = {
  item: CargaEmViagemListItemDTO;
};

function contagem(total: number, singular: string, plural: string): string {
  return `${total} ${total === 1 ? singular : plural}`;
}

function clientesLabel(clientes: CargaEmViagemListItemDTO["clientes"]): string {
  const nomes = clientes.map((cliente) => cliente.cliente).filter(Boolean);
  const visible = nomes.slice(0, VISIBLE_CLIENTES);
  const resto = nomes.length - visible.length;
  const label = visible.join(" · ");
  return resto > 0 ? `${label} +${resto}` : label;
}

/**
 * Linha da lista de cargas IBC em viagem.
 */
export default function CargaEmViagemListRow({ item }: Props) {
  const clientes = clientesLabel(item.clientes);

  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border-2 border-border bg-card p-4">
      <div className="flex min-w-0 flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-lg font-bold text-foreground">
            Carga {item.codCar}
            {item.destino ? (
              <span className="font-semibold text-muted-foreground">
                {" "}
                · {item.destino}
              </span>
            ) : null}
          </h3>
          <Badge variant="secondary" className="shrink-0 text-[10px]">
            Em viagem
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Expedida em {formatIsoDayMonthTimeLabel(item.fechadoEm)} ·{" "}
          {contagem(item.quantidadePedidos, "pedido", "pedidos")} ·{" "}
          {contagem(item.quantidadeIbcs, "IBC", "IBCs")}
        </p>
        {clientes ? (
          <p className="text-sm text-muted-foreground">{clientes}</p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <ExportarRelatorioViagemButton
          codCar={item.codCar}
          rotulo="Reimprimir relatório de viagem"
        />
        <Button asChild variant="outline" size="sm">
          <Link to={`/expedicao-ibc/${item.codCar}?origem=em-viagem`}>
            Ver detalhe
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
