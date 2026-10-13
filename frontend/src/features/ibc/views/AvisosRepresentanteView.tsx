import { Bell } from "lucide-react";
import DefaultLayout from "@/layout/DefaultLayout";
import AvisoRepresentanteCard from "../components/AvisoRepresentanteCard";
import ExpedicaoIbcAsyncState from "../components/ExpedicaoIbcAsyncState";
import { useAvisosRepresentante } from "../hooks/useAvisosRepresentante";
import { toError } from "../utils/toError";

/**
 * Lista de avisos do representante depois do Fechar Viagem (#39).
 */
export default function AvisosRepresentanteView() {
  const { isLoading, error, data, marcarLido } = useAvisosRepresentante();
  const avisos = data?.avisos ?? [];
  const pendingId = marcarLido.isPending ? marcarLido.variables : undefined;

  return (
    <ExpedicaoIbcAsyncState
      loading={isLoading}
      error={error ? toError(error) : null}
      loadingLabel="Carregando avisos…"
    >
      <DefaultLayout>
        <div className="mb-6 flex items-center gap-3">
          <Bell className="h-7 w-7 text-primary" aria-hidden="true" />
          <h1 className="text-2xl font-bold text-foreground">Avisos IBC</h1>
        </div>

        <div className="rounded-lg bg-card p-4 shadow-md sm:p-6">
          {avisos.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum container ficou no cliente.</p>
          ) : (
            avisos.map((aviso) => (
              <AvisoRepresentanteCard
                key={aviso.id}
                aviso={aviso}
                marcando={pendingId === aviso.id}
                onMarcarLido={marcarLido.mutate}
              />
            ))
          )}
        </div>
      </DefaultLayout>
    </ExpedicaoIbcAsyncState>
  );
}
