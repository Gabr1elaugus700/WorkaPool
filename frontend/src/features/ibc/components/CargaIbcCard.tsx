import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCount } from "@/utils/formatCount";
import { formatIsoDayMonthTimeLabel } from "@/utils/formatDate";
import ExportarRelatorioViagemButton from "./ExportarRelatorioViagemButton";
import IbcStationCard from "./IbcStationCard";
import PedidoIbcProgress from "./PedidoIbcProgress";
import { formatClientesCarga } from "../utils/cargaIbcCard.utils";
import { cargaIbcEtapaPath } from "../utils/cargaIbcEtapa";
import type { CargaEmViagemListItemDTO, CargaExpedicaoListItemDTO } from "../types/ibcExpedicao.types";

type Props =
  | { variant: "aguardando"; item: CargaExpedicaoListItemDTO }
  | { variant: "em-viagem"; item: CargaEmViagemListItemDTO };

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

export default function CargaIbcCard(props: Props) {
  if (props.variant === "aguardando") {
    const { codCar, destino, situacao, quantidadeAlocada, quantidadeEsperadaTotal } = props.item;
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

  const { item } = props;
  const clientes = formatClientesCarga(item.clientes);
  return (
    <IbcStationCard
      station="em-viagem"
      title={<CargaTitle codCar={item.codCar} destino={item.destino} />}
      meta={
        <>
          Expedida em {formatIsoDayMonthTimeLabel(item.fechadoEm)} ·{" "}
          {formatCount(item.quantidadePedidos, "pedido", "pedidos")} ·{" "}
          {formatCount(item.quantidadeIbcs, "IBC", "IBCs")}
        </>
      }
      actions={
        <>
          <ExportarRelatorioViagemButton
            codCar={item.codCar}
            rotulo="Reimprimir relatório de viagem"
            variant="ghost"
          />
          <OpenCargaLink to={cargaIbcEtapaPath(item.codCar, "em-viagem")} label="Ver detalhe" />
        </>
      }
    >
      {clientes ? <p className="text-muted-foreground">{clientes}</p> : null}
    </IbcStationCard>
  );
}
