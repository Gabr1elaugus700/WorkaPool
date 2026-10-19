import type { ReactNode } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Package } from "lucide-react";
import DefaultLayout from "@/layout/DefaultLayout";
import { useAuth } from "@/auth/AuthContext";
import { Button } from "@/components/ui/button";
import CargaIbcEtapas from "../components/CargaIbcEtapas";
import CargaIbcFecharViagemEtapa from "../components/CargaIbcFecharViagemEtapa";
import CargaIbcPreparacaoEtapa from "../components/CargaIbcPreparacaoEtapa";
import ExpedicaoIbcAccessDeniedAlert from "../components/ExpedicaoIbcAccessDeniedAlert";
import ExportarRelatorioViagemButton from "../components/ExportarRelatorioViagemButton";
import FecharExpedicaoButton from "../components/FecharExpedicaoButton";
import IbcPageHeader from "../components/IbcPageHeader";
import IbcPageStatus from "../components/IbcPageStatus";
import IbcStatusContent from "../components/IbcStatusContent";
import { useCargaExpedicaoDetalhe } from "../hooks/useCargaExpedicaoDetalhe";
import { useConciliacaoViagem } from "../hooks/useConciliacaoViagem";
import { canAccessExpedicaoIbc } from "../utils/canAccessExpedicaoIbc";
import {
  buildCargaIbcEtapas,
  cargaIbcEtapaPath,
  parseCargaIbcEtapa,
  resolveCargaIbcEtapaAtual,
  resolveCargaIbcEtapaVista,
  resolveCargaIbcVoltar,
} from "../utils/cargaIbcEtapa";

function parseCodCar(raw: string | undefined): number | null {
  const n = Number(raw);
  return raw && Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * Espaço de trabalho da carga: Preparação → Em viagem → Fechar viagem.
 * A etapa atual vem do estado da carga; a rota só escolhe qual etapa alcançável ver.
 */
export default function ExpedicaoIbcCargaView() {
  const { codCar: codCarParam, etapa: etapaParam } = useParams<{ codCar: string; etapa?: string }>();
  const codCar = parseCodCar(codCarParam);
  const navigate = useNavigate();
  const { user } = useAuth();
  const allowed = canAccessExpedicaoIbc(user?.role);

  const carga = useCargaExpedicaoDetalhe(codCar, allowed);
  const temExpedicao = carga.detalhe?.temExpedicao ?? false;
  const conciliacao = useConciliacaoViagem(codCar, allowed && temExpedicao, () =>
    navigate("/expedicao-ibc/em-viagem"),
  );

  if (!allowed) return <ExpedicaoIbcAccessDeniedAlert />;

  if (carga.error) return <IbcPageStatus status="error" error={carga.error} />;

  const { detalhe } = carga;
  const viagem = conciliacao.viagem;
  if (detalhe == null || codCar == null || (temExpedicao && viagem == null && conciliacao.error == null)) {
    return <IbcPageStatus status="loading" loadingLabel="Carregando carga…" />;
  }

  const viagemFechada = viagem?.viagemFechadaEm != null;
  const atual = resolveCargaIbcEtapaAtual({ temExpedicao, viagemFechadaEm: viagem?.viagemFechadaEm ?? null });
  const vista = resolveCargaIbcEtapaVista(atual, parseCargaIbcEtapa(etapaParam));
  if (etapaParam != null && etapaParam !== vista) {
    return <Navigate to={cargaIbcEtapaPath(codCar, vista)} replace />;
  }

  const relatorio = temExpedicao ? (
    <ExportarRelatorioViagemButton
      codCar={codCar}
      rotulo={atual === "preparacao" ? "Exportar viagem" : "Reimprimir relatório de viagem"}
    />
  ) : null;

  let primaryAction: ReactNode = null;
  if (vista === "preparacao" && !temExpedicao) {
    primaryAction = (
      <FecharExpedicaoButton
        podeFechar={detalhe.podeFecharExpedicao}
        loading={carga.fechando}
        onFechar={() => void carga.fecharExpedicao()}
      />
    );
  } else if (vista === "em-viagem" && atual === "em-viagem") {
    primaryAction = (
      <Button asChild size="sm">
        <Link to={cargaIbcEtapaPath(codCar, "fechar-viagem")}>Fechar viagem</Link>
      </Button>
    );
  }

  return (
    <DefaultLayout>
      <IbcPageHeader
        title={`Carga ${detalhe.codCar}`}
        subtitle={detalhe.destino || undefined}
        icon={<Package className="h-7 w-7 text-primary" aria-hidden />}
        secondaryActions={
          <>
            <Button asChild variant="outline" size="sm">
              <Link to={resolveCargaIbcVoltar(atual)}>
                <ArrowLeft className="h-4 w-4" aria-hidden />
                Voltar
              </Link>
            </Button>
            {relatorio}
          </>
        }
        primaryAction={primaryAction}
      />
      <CargaIbcEtapas etapas={buildCargaIbcEtapas({ codCar, atual, vista, viagemFechada })} />
      {vista === "fechar-viagem" ? (
        viagem ? (
          <CargaIbcFecharViagemEtapa codCar={codCar} viagem={viagem} conciliacao={conciliacao} />
        ) : conciliacao.error ? (
          <IbcStatusContent status="error" error={conciliacao.error} />
        ) : null
      ) : (
        <CargaIbcPreparacaoEtapa
          detalhe={detalhe}
          mutationsLocked={temExpedicao}
          allocatingNumPed={carga.allocatingNumPed}
          deallocatingId={carga.deallocatingId}
          substituidoNotice={carga.substituidoNotice}
          onAllocate={carga.vincular}
          onDeallocate={carga.desvincular}
        />
      )}
    </DefaultLayout>
  );
}
