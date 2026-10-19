import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import DefaultLayout from "@/layout/DefaultLayout";
import { useAuth } from "@/auth/AuthContext";
import { Button } from "@/components/ui/button";
import CargaIbcFecharViagemEtapa from "../components/CargaIbcFecharViagemEtapa";
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
  const conciliacao = useConciliacaoViagem(codCar, allowed, () => navigate("/expedicao-ibc/em-viagem"));
  if (!allowed) return <ExpedicaoIbcAccessDeniedAlert />;
  const { viagem } = conciliacao;
  const error = codCar == null ? new Error("Código de carga inválido.") : conciliacao.error;
  return (
    <ExpedicaoIbcAsyncState loading={conciliacao.loading || (viagem == null && error == null)} error={error} loadingLabel="Carregando conciliação…">
      <DefaultLayout>
        {viagem && codCar != null ? (
          <>
            <ExpedicaoIbcPageHeader title={`Fechar viagem · Carga ${viagem.codCar}`} activeSection="em-viagem">
              <Button asChild variant="outline" size="sm">
                <Link to={`/expedicao-ibc/${viagem.codCar}?origem=em-viagem`}>
                  <ArrowLeft className="h-4 w-4" />
                  Voltar
                </Link>
              </Button>
            </ExpedicaoIbcPageHeader>
            <CargaIbcFecharViagemEtapa codCar={codCar} viagem={viagem} conciliacao={conciliacao} />
          </>
        ) : null}
      </DefaultLayout>
    </ExpedicaoIbcAsyncState>
  );
}
