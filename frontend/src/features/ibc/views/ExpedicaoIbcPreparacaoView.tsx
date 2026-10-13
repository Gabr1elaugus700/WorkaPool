import { useCallback, useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
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
import { ibcExpedicaoService } from "../services/ibcExpedicaoService";
import type { CargaExpedicaoDetalheDTO } from "../types/ibcExpedicao.types";
import { canAccessExpedicaoIbc } from "../utils/canAccessExpedicaoIbc";
import { IbcAlocacaoRequestError } from "../utils/ibcAlocacaoError";
import { toError } from "../utils/toError";

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

  const [detalhe, setDetalhe] = useState<CargaExpedicaoDetalheDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [allocatingNumPed, setAllocatingNumPed] = useState<string | null>(null);
  const [substituidoNotice, setSubstituidoNotice] = useState<{
    numPed: string;
    title: string;
    message: string;
  } | null>(null);
  const [deallocatingId, setDeallocatingId] = useState<string | null>(null);
  const [fechando, setFechando] = useState(false);

  const carregar = useCallback(async () => {
    if (codCar == null) {
      setError(new Error("Código de carga inválido."));
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await ibcExpedicaoService.getCargaExpedicao(codCar);
      setDetalhe(data);
    } catch (err) {
      setError(toError(err));
    } finally {
      setLoading(false);
    }
  }, [codCar]);

  useEffect(() => {
    if (!allowed) {
      setLoading(false);
      return;
    }
    void carregar();
  }, [allowed, carregar]);

  const handleAllocate = async (
    numPed: string,
    identificador: string,
  ): Promise<boolean> => {
    if (codCar == null) return false;
    setAllocatingNumPed(numPed);
    setSubstituidoNotice((current) =>
      current?.numPed === numPed ? null : current,
    );
    try {
      await ibcExpedicaoService.createAlocacao({
        codCar,
        numPed,
        identificador,
      });
      setSubstituidoNotice(null);
      toast.success(`IBC ${identificador} vinculado ao pedido ${numPed}`);
      await carregar();
      return true;
    } catch (err) {
      if (
        err instanceof IbcAlocacaoRequestError &&
        err.substituido &&
        err.title
      ) {
        setSubstituidoNotice({
          numPed,
          title: err.title,
          message: err.message,
        });
        return false;
      }
      toast.error(toError(err).message);
      return true;
    } finally {
      setAllocatingNumPed(null);
    }
  };

  const handleDeallocate = async (alocacaoId: string) => {
    setDeallocatingId(alocacaoId);
    try {
      await ibcExpedicaoService.removeAlocacao(alocacaoId);
      toast.success("IBC desvinculado");
      await carregar();
    } catch (err) {
      toast.error(toError(err).message);
    } finally {
      setDeallocatingId(null);
    }
  };

  const handleFechar = async () => {
    if (codCar == null) return;
    setFechando(true);
    try {
      await ibcExpedicaoService.fecharExpedicao({ codCar });
      toast.success("Expedição IBC fechada — IBCs em viagem");
      await carregar();
    } catch (err) {
      toast.error(toError(err).message);
    } finally {
      setFechando(false);
    }
  };

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
                      void handleFechar();
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
                      handleAllocate(pedido.numPed, identificador)
                    }
                    onDeallocate={handleDeallocate}
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
