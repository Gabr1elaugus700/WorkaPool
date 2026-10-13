import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import DefaultLayout from "@/layout/DefaultLayout";
import { useAuth } from "@/auth/AuthContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import ConciliacaoIbcLinha from "../components/ConciliacaoIbcLinha";
import ConciliacaoRetornosPainel from "../components/ConciliacaoRetornosPainel";
import ConciliacaoTrocaDialog from "../components/ConciliacaoTrocaDialog";
import ExpedicaoIbcAccessDeniedAlert from "../components/ExpedicaoIbcAccessDeniedAlert";
import ExpedicaoIbcAsyncState from "../components/ExpedicaoIbcAsyncState";
import ExpedicaoIbcPageHeader from "../components/ExpedicaoIbcPageHeader";
import { conciliacaoViagemService } from "../services/conciliacaoViagemService";
import type { ConciliacaoViagemDTO, DestinoConciliacao, ModalidadeConciliacao } from "../types/conciliacaoViagem.types";
import { canAccessExpedicaoIbc } from "../utils/canAccessExpedicaoIbc";
import { toError } from "../utils/toError";
function parseCodCar(raw: string | undefined): number | null {
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}
export default function ConciliacaoViagemView() {
  const { codCar: raw } = useParams<{ codCar: string }>();
  const codCar = parseCodCar(raw);
  const navigate = useNavigate();
  const { user } = useAuth();
  const allowed = canAccessExpedicaoIbc(user?.role);
  const [viagem, setViagem] = useState<ConciliacaoViagemDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [trocaId, setTrocaId] = useState<string | null>(null);
  const carregar = useCallback(async () => {
    if (codCar == null) {
      setError(new Error("Código de carga inválido."));
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setViagem(await conciliacaoViagemService.consultar(codCar));
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
  if (!allowed) return <ExpedicaoIbcAccessDeniedAlert />;
  const fechada = viagem?.viagemFechadaEm != null;
  const marcados = viagem?.itens.filter((item) => item.destino != null).length ?? 0;
  const total = viagem?.itens.length ?? 0;
  const papelCompleto = viagem?.clientes.every((cliente) => cliente.quantidadePapel != null) ?? false;
  const trocaAberta = viagem?.itens.find((item) => item.alocacaoIbcId === trocaId) ?? null;
  const atualizar = (
    alocacaoIbcId: string,
    patch: (item: ConciliacaoViagemDTO["itens"][number]) => ConciliacaoViagemDTO["itens"][number],
  ) => {
    setViagem((atual) => atual && {
      ...atual,
      itens: atual.itens.map((item) => (item.alocacaoIbcId === alocacaoIbcId ? patch(item) : item)),
    });
  };
  const persistir = async (): Promise<boolean> => {
    if (!viagem || codCar == null) return false;
    const incompleta = viagem.itens.find((item) => item.destino === "FICOU" && item.modalidade == null);
    if (incompleta) {
      setAviso(`Escolha venda ou empréstimo para o IBC ${incompleta.identificador}.`);
      return false;
    }
    const salva = await conciliacaoViagemService.salvar(codCar, {
      itens: viagem.itens.flatMap((item) => item.destino == null ? [] : [{
        alocacaoIbcId: item.alocacaoIbcId,
        destino: item.destino,
        modalidade: item.modalidade,
      }]),
      retornosSemId: viagem.clientes.flatMap((cliente) => cliente.quantidadePapel == null ? [] : [{
        chaveCliente: cliente.chaveCliente,
        quantidadePapel: cliente.quantidadePapel,
        confirmouDivergencia: cliente.confirmouDivergencia,
      }]),
    });
    setViagem(salva);
    return true;
  };
  const executar = async (fechar: boolean) => {
    setSalvando(true);
    setAviso(null);
    try {
      if (!(await persistir())) return;
      if (!fechar) {
        toast.success("Conciliação salva.");
        return;
      }
      if (codCar == null) return;
      await conciliacaoViagemService.fechar(codCar);
      toast.success("Viagem fechada.");
      navigate("/expedicao-ibc/em-viagem");
    } catch (err) {
      setAviso(toError(err).message);
    } finally {
      setSalvando(false);
    }
  };
  return (
    <ExpedicaoIbcAsyncState loading={loading} error={error} loadingLabel="Carregando conciliação…">
      <DefaultLayout>
        {viagem ? (
          <>
            <ExpedicaoIbcPageHeader title={`Fechar viagem · Carga ${viagem.codCar}`} activeSection="em-viagem">
              <Button asChild variant="outline" size="sm">
                <Link to={`/expedicao-ibc/${viagem.codCar}?origem=em-viagem`}>
                  <ArrowLeft className="h-4 w-4" />
                  Voltar
                </Link>
              </Button>
            </ExpedicaoIbcPageHeader>
            <p className="mb-4 max-w-[65ch] text-sm text-muted-foreground">
              {fechada
                ? "Esta viagem já foi fechada. O checklist fica só para consulta."
                : `${marcados} de ${total} IBCs marcados. Salve o andamento e feche quando o papel estiver completo.`}
            </p>
            {aviso ? (
              <Alert className="mb-4" variant="destructive">
                <AlertDescription>{aviso}</AlertDescription>
              </Alert>
            ) : null}
            <div className="flex flex-col gap-3">
              {viagem.itens.map((item) => (
                <ConciliacaoIbcLinha
                  key={item.alocacaoIbcId}
                  item={item}
                  disabled={fechada || salvando}
                  onDestino={(destino: DestinoConciliacao) => atualizar(item.alocacaoIbcId, (atual) => ({
                    ...atual,
                    destino,
                    modalidade: destino === "FICOU" ? atual.modalidade ?? atual.modalidadeSugerida : null,
                  }))}
                  onModalidade={(modalidade: ModalidadeConciliacao) => atualizar(item.alocacaoIbcId, (atual) => ({
                    ...atual,
                    modalidade,
                  }))}
                  onTroca={() => setTrocaId(item.alocacaoIbcId)}
                />
              ))}
            </div>
            <ConciliacaoRetornosPainel
              clientes={viagem.clientes}
              itens={viagem.itens}
              disabled={fechada || salvando}
              onChange={(chaveCliente, patch) => setViagem((atual) => atual && ({
                ...atual,
                clientes: atual.clientes.map((cliente) => cliente.chaveCliente === chaveCliente ? { ...cliente, ...patch } : cliente),
              }))}
            />
            {trocaAberta && codCar != null ? (
              <ConciliacaoTrocaDialog
                codCar={codCar}
                alocacaoIbcId={trocaAberta.alocacaoIbcId}
                identificador={trocaAberta.identificador}
                open
                onOpenChange={(open) => { if (!open) setTrocaId(null); }}
                onRegistrada={(ibcEntradaId) => atualizar(trocaAberta.alocacaoIbcId, (atual) => ({ ...atual, ibcEntradaId }))}
              />
            ) : null}
            {fechada ? null : (
              <div className="mt-6 flex flex-wrap gap-2">
                <Button type="button" variant="outline" disabled={salvando} onClick={() => void executar(false)}>
                  Salvar andamento
                </Button>
                <Button type="button" disabled={salvando || marcados !== total || total === 0 || !papelCompleto} onClick={() => void executar(true)}>
                  Fechar viagem
                </Button>
              </div>
            )}
          </>
        ) : null}
      </DefaultLayout>
    </ExpedicaoIbcAsyncState>
  );
}
