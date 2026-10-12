import DefaultLayout from "@/layout/DefaultLayout";
import ExpedicaoIbcAccessDeniedAlert from "../components/ExpedicaoIbcAccessDeniedAlert";
import ExpedicaoIbcAsyncState from "../components/ExpedicaoIbcAsyncState";
import CargaEmViagemListRow from "../components/CargaEmViagemListRow";
import ExpedicaoIbcPageHeader from "../components/ExpedicaoIbcPageHeader";
import { useCargasEmViagem } from "../hooks/useCargasEmViagem";
import { toError } from "../utils/toError";

/**
 * Cargas expedidas cuja viagem ainda não foi fechada (#320).
 */
export default function ExpedicaoIbcEmViagemView() {
  const { allowed, isLoading, error, data } = useCargasEmViagem();

  if (!allowed) {
    return <ExpedicaoIbcAccessDeniedAlert />;
  }

  const cargas = data ?? [];

  return (
    <ExpedicaoIbcAsyncState
      loading={isLoading}
      error={error ? toError(error) : null}
      loadingLabel="Carregando cargas em viagem…"
    >
      <DefaultLayout>
        <ExpedicaoIbcPageHeader activeSection="em-viagem" />

        <div className="rounded-lg bg-card p-4 shadow-md sm:p-6">
          {cargas.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma carga em viagem no momento.
            </p>
          ) : (
            cargas.map((item) => (
              <CargaEmViagemListRow key={item.codCar} item={item} />
            ))
          )}
        </div>
      </DefaultLayout>
    </ExpedicaoIbcAsyncState>
  );
}
