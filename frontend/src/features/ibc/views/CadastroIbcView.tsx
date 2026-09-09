import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import DefaultLayout from "@/layout/DefaultLayout";
import { useAuth } from "@/auth/AuthContext";
import ExpedicaoIbcAccessDeniedAlert from "../components/ExpedicaoIbcAccessDeniedAlert";
import ExpedicaoIbcAsyncState from "../components/ExpedicaoIbcAsyncState";
import CadastroIbcForm from "../components/CadastroIbcForm";
import CadastroIbcPoolList from "../components/CadastroIbcPoolList";
import CadastroIbcAlertsPanel from "../components/CadastroIbcAlertsPanel";
import { ibcCadastroService } from "../services/ibcCadastroService";
import { canAccessIbcCadastro } from "../utils/canAccessIbcCadastro";
import { toError } from "../utils/toError";

const POOL_KEY = ["ibc", "pool"] as const;
const ALERTS_KEY = ["ibc", "alerts"] as const;

export default function CadastroIbcView() {
  const { user } = useAuth();
  const allowed = canAccessIbcCadastro(user?.role);
  const queryClient = useQueryClient();

  const poolQuery = useQuery({
    queryKey: POOL_KEY,
    queryFn: () => ibcCadastroService.listPool(),
    enabled: allowed,
  });
  const alertsQuery = useQuery({
    queryKey: ALERTS_KEY,
    queryFn: ibcCadastroService.listAlerts,
    enabled: allowed,
  });

  const createMutation = useMutation({
    mutationFn: ibcCadastroService.createNovo,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: POOL_KEY }),
        queryClient.invalidateQueries({ queryKey: ALERTS_KEY }),
      ]);
    },
  });

  if (!allowed) {
    return <ExpedicaoIbcAccessDeniedAlert />;
  }

  const loading = poolQuery.isLoading || alertsQuery.isLoading;
  const error = poolQuery.error ?? alertsQuery.error ?? createMutation.error;

  return (
    <ExpedicaoIbcAsyncState
      loading={loading}
      error={error ? toError(error) : null}
      loadingLabel="Carregando cadastro IBC…"
    >
      <DefaultLayout>
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">Cadastro IBC</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Novo IBC nasce Inapto / Aguardando inspeção com identificador HM
            automático.
          </p>
        </div>

        <section className="mb-6 rounded-lg bg-card p-4 shadow-md sm:p-6">
          <h2 className="mb-3 text-sm font-medium">Novo IBC</h2>
          <CadastroIbcForm
            submitting={createMutation.isPending}
            onSubmit={(dataLimite) => createMutation.mutateAsync({ dataLimite })}
          />
          {createMutation.isSuccess ? (
            <p className="mt-3 text-sm text-muted-foreground">
              Cadastrado: {createMutation.data.identificador}
            </p>
          ) : null}
        </section>

        <section className="mb-6 rounded-lg bg-card p-4 shadow-md sm:p-6">
          <h2 className="mb-3 text-sm font-medium">Alertas</h2>
          <CadastroIbcAlertsPanel alerts={alertsQuery.data ?? []} />
        </section>

        <section className="rounded-lg bg-card p-4 shadow-md sm:p-6">
          <h2 className="mb-3 text-sm font-medium">Pool ativo</h2>
          <CadastroIbcPoolList items={poolQuery.data ?? []} />
        </section>
      </DefaultLayout>
    </ExpedicaoIbcAsyncState>
  );
}
