import { Scale } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import DefaultLayout from "@/layout/DefaultLayout";
import ConciliacaoErpLista from "../components/ConciliacaoErpLista";
import ConciliacaoErpPainel from "../components/ConciliacaoErpPainel";
import ExpedicaoIbcAsyncState from "../components/ExpedicaoIbcAsyncState";
import { useConciliacaoErp } from "../hooks/useConciliacaoErp";
import type { BucketConsultaConciliacaoErp } from "../types/conciliacaoErp.types";
import { conciliacaoErpApresentacao } from "../utils/conciliacaoErp.utils";
import { toError } from "../utils/toError";

export default function ConciliacaoErpView() {
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
    <ExpedicaoIbcAsyncState
      loading={isLoading}
      error={error ? toError(error) : null}
      loadingLabel="Carregando conciliação…"
    >
      <DefaultLayout>
        <div className="mb-6 flex items-center gap-3">
          <Scale className="h-7 w-7 text-primary" aria-hidden="true" />
          <h1 className="text-2xl font-bold text-foreground">Conciliação IBC</h1>
        </div>
        <p className="mb-6 max-w-3xl text-sm text-muted-foreground">Saldo fiscal do ERP comparado aos IBCs vivos no WorkaPool. Somente leitura.</p>
        {data ? (
          <>
            <ConciliacaoErpPainel relatorio={data} ativo={bucket} onSelecionar={selecionar} />
            {bucket ? <ConciliacaoErpLista bucket={bucket} itens={data.itens} /> : null}
          </>
        ) : null}
      </DefaultLayout>
    </ExpedicaoIbcAsyncState>
  );
}
