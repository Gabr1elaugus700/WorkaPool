import { Link, useParams, useSearchParams } from "react-router-dom";
import DefaultLayout from "@/layout/DefaultLayout";
import { useAuth } from "@/auth/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import ExpedicaoIbcAccessDeniedAlert from "../components/ExpedicaoIbcAccessDeniedAlert";
import ExportarRelatorioViagemButton from "../components/ExportarRelatorioViagemButton";
import ExpedicaoIbcAsyncState from "../components/ExpedicaoIbcAsyncState";
import ExpedicaoIbcPageHeader from "../components/ExpedicaoIbcPageHeader";
import FecharExpedicaoButton from "../components/FecharExpedicaoButton";
import PedidoIbcPreparacaoCard from "../components/PedidoIbcPreparacaoCard";
import PedidoIbcProgress from "../components/PedidoIbcProgress";
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

            <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border-2 border-border bg-card p-4">
              <Badge variant="secondary" className="text-[10px]">
                {detalhe.situacao}
              </Badge>
              {detalhe.destino ? (
                <span className="text-sm font-medium text-foreground">
                  {detalhe.destino}
                </span>
              ) : null}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Progresso:</span>
                <PedidoIbcProgress
                  alocado={detalhe.quantidadeAlocada}
                  esperado={detalhe.quantidadeEsperadaTotal}
                />
              </div>
              {fromEmViagem ? (
                <Badge variant="secondary" className="text-[10px]">
                  Em viagem
                </Badge>
              ) : detalhe.temExpedicao ? (
                <Badge variant="outline" className="text-[10px]">
                  Expedição fechada
                </Badge>
              ) : null}
            </div>

            {detalhe.pedidos.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum pedido IBC nesta carga.
              </p>
            ) : (
              <div className="space-y-4">
                {detalhe.pedidos.map((pedido) => (
                  <PedidoIbcPreparacaoCard
                    key={pedido.numPed}
                    pedido={pedido}
                    mutationsLocked={detalhe.temExpedicao || fromEmViagem}
                    allocating={allocatingNumPed === pedido.numPed}
                    deallocatingId={deallocatingId}
                    allocationNotice={
                      substituidoNotice?.numPed === pedido.numPed
                        ? substituidoNotice
                        : null
                    }
                    onAllocate={(identificador) =>
                      vincular(pedido.numPed, identificador)
                    }
                    onDeallocate={desvincular}
                  />
                ))}
              </div>
            )}
          </>
        ) : null}
      </DefaultLayout>
    </ExpedicaoIbcAsyncState>
  );
}
