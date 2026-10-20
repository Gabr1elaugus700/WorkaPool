import { useSearchParams } from "react-router-dom";
import DefaultLayout from "@/layout/DefaultLayout";
import { useAuth } from "@/auth/AuthContext";
import ConciliacaoErpLista from "../components/ConciliacaoErpLista";
import ConciliacaoErpPainel from "../components/ConciliacaoErpPainel";
import GestaoIbcHeader from "../components/GestaoIbcHeader";
import IbcStatusContent from "../components/IbcStatusContent";
import { useConciliacaoErp } from "../hooks/useConciliacaoErp";
import type { BucketConsultaConciliacaoErp } from "../types/conciliacaoErp.types";
import { conciliacaoErpApresentacao } from "../utils/conciliacaoErp.utils";
import { toError } from "../utils/toError";

export default function ConciliacaoErpView() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const bruto = searchParams.get("bucket");
  const bucket = conciliacaoErpApresentacao.isBucket(bruto) ? bruto : undefined;
  const { isLoading, error, data } = useConciliacaoErp(bucket);

  function selecionar(proximo: BucketConsultaConciliacaoErp) {
    const params = new URLSearchParams(searchParams);
    if (proximo === bucket) params.delete("bucket");
    else params.set("bucket", proximo);
    setSearchParams(params, { replace: true });
  }

  return (
    <DefaultLayout>
      <div className="space-y-6">
        <GestaoIbcHeader activeSection="conciliacao" userRole={user?.role} />
        <p className="max-w-prose text-sm text-muted-foreground">
          Saldo fiscal do ERP comparado aos IBCs vivos no WorkaPool. Somente leitura.
        </p>
        {isLoading ? (
          <IbcStatusContent status="loading" loadingLabel="Carregando conciliação…" />
        ) : error ? (
          <IbcStatusContent status="error" error={toError(error)} />
        ) : data ? (
          <>
            <ConciliacaoErpPainel relatorio={data} ativo={bucket} onSelecionar={selecionar} />
            {bucket ? <ConciliacaoErpLista bucket={bucket} itens={data.itens} /> : null}
          </>
        ) : null}
      </div>
    </DefaultLayout>
  );
}
