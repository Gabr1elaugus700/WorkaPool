import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import IbcStationCard from "./IbcStationCard";
import PedidoIbcProgress from "./PedidoIbcProgress";
import type { CargaExpedicaoListItemDTO } from "../types/ibcExpedicao.types";

type Props = { variant: "aguardando"; item: CargaExpedicaoListItemDTO };

function CargaTitle({ codCar, destino }: { codCar: number; destino: string }) {
  return (
    <>
      Carga {codCar}
      {destino ? <span className="block text-sm font-medium text-muted-foreground">{destino}</span> : null}
    </>
  );
}

function OpenCargaLink({ to, label }: { to: string; label: string }) {
  return (
    <Button asChild variant="outline" size="sm">
      <Link to={to}>
        {label}
        <ChevronRight className="h-4 w-4" aria-hidden />
      </Link>
    </Button>
  );
}

export default function CargaIbcCard({ item }: Props) {
  const { codCar, destino, situacao, quantidadeAlocada, quantidadeEsperadaTotal } = item;
  return (
    <IbcStationCard
      station="aguardando"
      title={<CargaTitle codCar={codCar} destino={destino} />}
      meta={situacao}
      actions={<OpenCargaLink to={`/expedicao-ibc/${codCar}`} label="Preparar" />}
    >
      <p className="flex items-center gap-2 text-muted-foreground">
        Progresso IBC:
        <PedidoIbcProgress alocado={quantidadeAlocada} esperado={quantidadeEsperadaTotal} />
      </p>
    </IbcStationCard>
  );
}
