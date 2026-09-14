import { Link } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import DefaultLayout from "@/layout/DefaultLayout";
import { OverviewSyncRunsTable } from "../components/OverviewSyncRunsTable";
import { OverviewSyncStatusBar } from "../components/OverviewSyncStatusBar";
import {
  useOverviewSyncRuns,
  useOverviewSyncStatus,
  useRetryOverviewSyncFailedStep,
} from "../hooks/useOverviewSyncAdmin";

export function OverviewSyncAdminView() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const statusQuery = useOverviewSyncStatus();
  const runsQuery = useOverviewSyncRuns();
  const { retryFailedStep, isRetrying } = useRetryOverviewSyncFailedStep();

  if (!isAdmin) {
    return (
      <DefaultLayout>
        <div className="p-6">
          <h1 className="text-2xl font-semibold">Acesso negado</h1>
          <p className="mt-2 text-muted-foreground">
            Apenas administradores podem operar o sync do Overview.
          </p>
          <Link to="/" className="mt-4 inline-block text-primary underline">
            Voltar ao início
          </Link>
        </div>
      </DefaultLayout>
    );
  }

  const refresh = () => {
    void statusQuery.refetch();
    void runsQuery.refetch();
  };

  return (
    <DefaultLayout>
      <div className="p-6">
        <h1 className="mb-2 text-2xl font-semibold">Overview Sync</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Runs, erros e retry de steps do sync overnight do Customer Overview.
        </p>

        <OverviewSyncStatusBar
          status={statusQuery.data}
          isLoading={statusQuery.isLoading}
          onRefresh={refresh}
        />

        {runsQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando runs…</p>
        ) : runsQuery.isError ? (
          <p className="text-sm text-destructive">
            Não foi possível carregar os runs do sync.
          </p>
        ) : (
          <OverviewSyncRunsTable
            runs={runsQuery.data ?? []}
            isRetrying={isRetrying}
            onRetryFailedStep={(runId, stepName) => {
              void retryFailedStep(runId, stepName);
            }}
          />
        )}
      </div>
    </DefaultLayout>
  );
}

export default OverviewSyncAdminView;
