import { Link, useParams, useSearchParams } from "react-router-dom";
import DefaultLayout from "@/layout/DefaultLayout";
import { useAuth } from "@/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import CargaIbcPreparacaoEtapa from "../components/CargaIbcPreparacaoEtapa";
import ExpedicaoIbcAccessDeniedAlert from "../components/ExpedicaoIbcAccessDeniedAlert";
import ExportarRelatorioViagemButton from "../components/ExportarRelatorioViagemButton";
import ExpedicaoIbcAsyncState from "../components/ExpedicaoIbcAsyncState";
import ExpedicaoIbcPageHeader from "../components/ExpedicaoIbcPageHeader";
import FecharExpedicaoButton from "../components/FecharExpedicaoButton";
import { useCargaExpedicaoDetalhe } from "../hooks/useCargaExpedicaoDetalhe";
import { canAccessExpedicaoIbc } from "../utils/canAccessExpedicaoIbc";

function parseCodCar(raw: string | undefined): number | null {
  if (raw == null || raw === "") return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

/**
 * Preparação de expedição em carga FECHADA: vincular/desvincular IBC e fechar (#59/#60).
 * Vinda de /expedicao-ibc/em-viagem, a mesma tela fica só leitura (#320).
 */
export default function ExpedicaoIbcPreparacaoView() {
  const { codCar: codCarParam } = useParams<{ codCar: string }>();
  const [searchParams] = useSearchParams();
  const fromEmViagem = searchParams.get("origem") === "em-viagem";
  const codCar = parseCodCar(codCarParam);
  const { user } = useAuth();
  const allowed = canAccessExpedicaoIbc(user?.role);
  const {
    detalhe,
    loading,
    error,
    allocatingNumPed,
    substituidoNotice,
    deallocatingId,
    fechando,
    vincular,
    desvincular,
    fecharExpedicao,
  } = useCargaExpedicaoDetalhe(codCar, allowed);

  if (!allowed) {
    return <ExpedicaoIbcAccessDeniedAlert />;
  }

  return (
    <ExpedicaoIbcAsyncState
      loading={loading}
      error={error}
      loadingLabel="Carregando preparação…"
    >
      <DefaultLayout>
        {detalhe ? (
          <>
            <ExpedicaoIbcPageHeader
              title={
                fromEmViagem
                  ? `Carga ${detalhe.codCar}`
                  : `Preparação · Carga ${detalhe.codCar}`
              }
            >
              <div className="flex flex-wrap items-center gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link
                    to={
                      fromEmViagem
                        ? "/expedicao-ibc/em-viagem"
                        : "/expedicao-ibc"
                    }
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Voltar
                  </Link>
                </Button>
                {fromEmViagem ? (
                  <Button asChild size="sm">
                    <Link to={`/expedicao-ibc/${detalhe.codCar}/conciliacao`}>
                      Fechar viagem
                    </Link>
                  </Button>
                ) : null}
                {fromEmViagem || detalhe.temExpedicao ? (
                  <ExportarRelatorioViagemButton
                    codCar={detalhe.codCar}
                    rotulo={
                      fromEmViagem
                        ? "Reimprimir relatório de viagem"
                        : "Exportar viagem"
                    }
                  />
                ) : null}
                {fromEmViagem ? null : (
                  <FecharExpedicaoButton
                    podeFechar={detalhe.podeFecharExpedicao}
                    loading={fechando}
                    onFechar={() => {
                      void fecharExpedicao();
                    }}
                  />
                )}
              </div>
            </ExpedicaoIbcPageHeader>

            <CargaIbcPreparacaoEtapa
              detalhe={detalhe}
              mutationsLocked={detalhe.temExpedicao || fromEmViagem}
              allocatingNumPed={allocatingNumPed}
              deallocatingId={deallocatingId}
              substituidoNotice={substituidoNotice}
              onAllocate={vincular}
              onDeallocate={desvincular}
            />
          </>
        ) : null}
      </DefaultLayout>
    </ExpedicaoIbcAsyncState>
  );
}
