import { Clock } from "lucide-react";
import DefaultLayout from "@/layout/DefaultLayout";
import EmprestimosAtrasadosTabela from "../components/EmprestimosAtrasadosTabela";
import ExpedicaoIbcAsyncState from "../components/ExpedicaoIbcAsyncState";
import { useEmprestimosAtrasados } from "../hooks/useEmprestimosAtrasados";
import { toError } from "../utils/toError";

export default function EmprestimosAtrasadosView() {
  const { isLoading, error, data } = useEmprestimosAtrasados();

  return (
    <ExpedicaoIbcAsyncState
      loading={isLoading}
      error={error ? toError(error) : null}
      loadingLabel="Carregando empréstimos…"
    >
      <DefaultLayout>
        <header className="mb-8 max-w-3xl">
          <div className="mb-3 flex items-center gap-3">
            <Clock className="h-7 w-7 text-primary" aria-hidden="true" />
            <h1 className="text-2xl font-bold text-foreground">Empréstimos em atraso</h1>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Empréstimos cujo prazo de devolução já passou e o IBC continua no cliente.
          </p>
        </header>
        <EmprestimosAtrasadosTabela itens={data?.itens ?? []} />
      </DefaultLayout>
    </ExpedicaoIbcAsyncState>
  );
}
