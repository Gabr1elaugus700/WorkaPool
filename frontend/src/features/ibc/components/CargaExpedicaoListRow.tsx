import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CargaExpedicaoListItemDTO } from "../types/ibcExpedicao.types";
import PedidoIbcProgress from "./PedidoIbcProgress";
import { ChevronRight } from "lucide-react";

type Props = {
  item: CargaExpedicaoListItemDTO;
};

/**
 * Linha da lista de cargas para expedição IBC.
 */
export default function CargaExpedicaoListRow({ item }: Props) {
  const { codCar, destino, situacao, quantidadeAlocada, quantidadeEsperadaTotal } =
    item;

  return (
    <div className="rounded-xl border-2 border-border bg-card p-4 mb-3 flex flex-wrap items-center justify-between gap-3">
      <div className="flex min-w-0 flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-lg font-bold text-foreground">
            Carga {codCar}
            {destino ? (
              <span className="font-semibold text-muted-foreground">
                {" "}
                · {destino}
              </span>
            ) : null}
          </h3>
          <Badge variant="secondary" className="shrink-0 text-[10px]">
            {situacao}
          </Badge>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Progresso IBC:</span>
          <PedidoIbcProgress
            alocado={quantidadeAlocada}
            esperado={quantidadeEsperadaTotal}
          />
        </div>
      </div>

      <Button asChild variant="outline" size="sm">
        <Link to={`/expedicao-ibc/${codCar}`}>
          Preparar
          <ChevronRight className="h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
}
