import { Link } from "react-router-dom";
import { Calendar, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatCount } from "@/utils/formatCount";
import { formatIsoDayMonthTimeLabel } from "@/utils/formatDate";
import ExportarRelatorioViagemButton from "./ExportarRelatorioViagemButton";
import IbcStationCard from "./IbcStationCard";
import PedidoIbcProgress from "./PedidoIbcProgress";
import {
  formatCargaPrevisaoSaidaLabel,
  formatClientesCarga,
} from "../utils/cargaIbcCard.utils";
import { cargaIbcEtapa } from "../utils/cargaIbcEtapa";
import type { CargaEmViagemListItemDTO, CargaExpedicaoListItemDTO } from "../types/ibcExpedicao.types";

type Props =
  | { variant: "aguardando"; item: CargaExpedicaoListItemDTO }
  | { variant: "em-viagem"; item: CargaEmViagemListItemDTO };

function CargaIbcCardHeading({ codCar, destino }: { codCar: number; destino: string }) {
  const destinoLabel = destino.trim();

  return (
    <>
      {destinoLabel || `Carga ${codCar}`}
      {destinoLabel ? (
        <span className="mt-0.5 block text-sm font-normal text-muted-foreground">Carga {codCar}</span>
      ) : null}
    </>
  );
}

function CargaIbcPrevisaoChip({ previsaoSaida }: { previsaoSaida: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border bg-muted/40 px-2.5 py-1 text-xs text-foreground">
      <Calendar className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
      Saída prevista:{" "}
      <span className="font-semibold">{formatCargaPrevisaoSaidaLabel(previsaoSaida)}</span>
    </span>
  );
}

function CargaIbcMetaChips({
  previsaoSaida,
  situacao,
}: {
  previsaoSaida: string;
  situacao: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <CargaIbcPrevisaoChip previsaoSaida={previsaoSaida} />
      <Badge variant="secondary" className="rounded-full px-2.5 py-1 text-xs font-medium">
        {situacao}
      </Badge>
    </div>
  );
}

function progressPercent(alocado: number, esperado: number): number {
  if (esperado <= 0) return 0;
  return Math.min(100, (alocado / esperado) * 100);
}

type OpenCargaLinkProps = {
  to: string;
  label: string;
  fullWidth?: boolean;
};

function OpenCargaLink({ to, label, fullWidth = false }: OpenCargaLinkProps) {
  return (
    <Button asChild variant={fullWidth ? "default" : "outline"} size="sm" className={fullWidth ? "w-full" : undefined}>
      <Link to={to}>
        {label}
        <ChevronRight className="h-4 w-4" aria-hidden />
      </Link>
    </Button>
  );
}

export default function CargaIbcCard(props: Props) {
  if (props.variant === "aguardando") {
    const { codCar, destino, previsaoSaida, situacao, quantidadeAlocada, quantidadeEsperadaTotal } =
      props.item;
    return (
      <IbcStationCard
        station="aguardando"
        title={<CargaIbcCardHeading codCar={codCar} destino={destino} />}
        meta={<CargaIbcMetaChips previsaoSaida={previsaoSaida} situacao={situacao} />}
        metaClassName="text-xs text-foreground"
        actions={<OpenCargaLink to={`/expedicao-ibc/${codCar}`} label="Preparar" fullWidth />}
        actionsClassName="mt-auto w-full pt-1"
      >
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm text-muted-foreground">Progresso IBC</span>
            <PedidoIbcProgress alocado={quantidadeAlocada} esperado={quantidadeEsperadaTotal} />
          </div>
          <Progress
            value={progressPercent(quantidadeAlocada, quantidadeEsperadaTotal)}
            className="h-2"
            aria-label="Progresso de alocação IBC"
          />
        </div>
      </IbcStationCard>
    );
  }

  const { item } = props;
  const clientes = formatClientesCarga(item.clientes);
  return (
    <IbcStationCard
      station="em-viagem"
      title={<CargaIbcCardHeading codCar={item.codCar} destino={item.destino} />}
      meta={
        <>
          <CargaIbcMetaChips previsaoSaida={item.previsaoSaida} situacao={item.situacao} />
          <p className="mt-2 text-xs text-muted-foreground">
            Expedida em {formatIsoDayMonthTimeLabel(item.fechadoEm)} ·{" "}
            {formatCount(item.quantidadePedidos, "pedido", "pedidos")} ·{" "}
            {formatCount(item.quantidadeIbcs, "IBC", "IBCs")}
          </p>
        </>
      }
      metaClassName="text-xs text-foreground"
      actions={
        <>
          <ExportarRelatorioViagemButton
            codCar={item.codCar}
            rotulo="Reimprimir relatório de viagem"
            variant="ghost"
          />
          <OpenCargaLink to={cargaIbcEtapa.path(item.codCar, "em-viagem")} label="Ver detalhe" />
        </>
      }
    >
      {clientes ? <p className="text-muted-foreground">{clientes}</p> : null}
    </IbcStationCard>
  );
}