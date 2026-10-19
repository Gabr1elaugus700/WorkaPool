import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
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
import { useConciliacaoViagem } from "../hooks/useConciliacaoViagem";
import { canAccessExpedicaoIbc } from "../utils/canAccessExpedicaoIbc";
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
  const [trocaId, setTrocaId] = useState<string | null>(null);
  const conciliacao = useConciliacaoViagem(codCar, allowed, () => navigate("/expedicao-ibc/em-viagem"));
  if (!allowed) return <ExpedicaoIbcAccessDeniedAlert />;
  const { viagem, fechada, salvando, marcados, total, aviso } = conciliacao;
  const error = codCar == null ? new Error("Código de carga inválido.") : conciliacao.error;
  const trocaAberta = viagem?.itens.find((item) => item.alocacaoIbcId === trocaId) ?? null;
  return (
    <ExpedicaoIbcAsyncState loading={conciliacao.loading || (viagem == null && error == null)} error={error} loadingLabel="Carregando conciliação…">
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
                  onDestino={(destino) => conciliacao.marcarDestino(item.alocacaoIbcId, destino)}
                  onModalidade={(modalidade) => conciliacao.marcarModalidade(item.alocacaoIbcId, modalidade)}
                  onTroca={() => setTrocaId(item.alocacaoIbcId)}
                />
              ))}
            </div>
            <ConciliacaoRetornosPainel
              clientes={viagem.clientes}
              itens={viagem.itens}
              disabled={fechada || salvando}
              onChange={conciliacao.atualizarCliente}
            />
            {trocaAberta && codCar != null ? (
              <ConciliacaoTrocaDialog
                codCar={codCar}
                alocacaoIbcId={trocaAberta.alocacaoIbcId}
                identificador={trocaAberta.identificador}
                open
                onOpenChange={(open) => { if (!open) setTrocaId(null); }}
                onRegistrada={(ibcEntradaId) => conciliacao.vincularTroca(trocaAberta.alocacaoIbcId, ibcEntradaId)}
              />
            ) : null}
            {fechada ? null : (
              <div className="mt-6 flex flex-wrap gap-2">
                <Button type="button" variant="outline" disabled={salvando} onClick={() => void conciliacao.salvarAndamento()}>
                  Salvar andamento
                </Button>
                <Button type="button" disabled={!conciliacao.podeFechar} onClick={() => void conciliacao.fecharViagem()}>
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
