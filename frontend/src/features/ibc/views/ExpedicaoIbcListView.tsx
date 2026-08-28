import { useQuery } from "@tanstack/react-query";
import DefaultLayout from "@/layout/DefaultLayout";
import { useAuth } from "@/auth/AuthContext";
import ExpedicaoIbcAccessDeniedAlert from "../components/ExpedicaoIbcAccessDeniedAlert";
import ExpedicaoIbcAsyncState from "../components/ExpedicaoIbcAsyncState";
import ExpedicaoIbcPageHeader from "../components/ExpedicaoIbcPageHeader";
import CargaExpedicaoListRow from "../components/CargaExpedicaoListRow";
import { ibcExpedicaoService } from "../services/ibcExpedicaoService";
import { canAccessExpedicaoIbc } from "../utils/canAccessExpedicaoIbc";
import { toError } from "../utils/toError";
import { useIbcRealtime } from "../hooks/useIbcRealtime";

/**
 * Lista de cargas ABERTA/FECHADA para preparação de expedição IBC (#61).
 */
export default function ExpedicaoIbcListView() {
  const { user } = useAuth();
  const allowed = canAccessExpedicaoIbc(user?.role);
  const query = useQuery({
    queryKey: ["ibc", "cargas-expedicao"],
    queryFn: ibcExpedicaoService.listCargasExpedicao,
    enabled: allowed,
  });
  useIbcRealtime();

  if (!allowed) {
    return <ExpedicaoIbcAccessDeniedAlert />;
  }

  return (
    <ExpedicaoIbcAsyncState
      loading={query.isLoading}
      error={query.error ? toError(query.error) : null}
      loadingLabel="Carregando cargas de expedição…"
    >
      <DefaultLayout>
        <ExpedicaoIbcPageHeader />

        <div className="rounded-lg bg-card p-4 shadow-md sm:p-6">
          <p className="mb-4 text-sm text-muted-foreground">
            Cargas ABERTA e FECHADA para preparação de alocação IBC.
          </p>

          {(query.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma carga disponível para expedição IBC.
            </p>
          ) : (
            (query.data ?? []).map((item) => (
              <CargaExpedicaoListRow key={item.codCar} item={item} />
            ))
          )}
        </div>
      </DefaultLayout>
    </ExpedicaoIbcAsyncState>
  );
}
