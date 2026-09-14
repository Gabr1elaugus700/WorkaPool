import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import DefaultLayout from "@/layout/DefaultLayout";
import { useAuth } from "@/auth/AuthContext";
import ExpedicaoIbcAccessDeniedAlert from "../components/ExpedicaoIbcAccessDeniedAlert";
import CadastroIbcForm from "../components/CadastroIbcForm";
import CadastroIbcLoteForm from "../components/CadastroIbcLoteForm";
import CadastroIbcLoteWarningBanner from "../components/CadastroIbcLoteWarningBanner";
import CadastroIbcModeSelector, {
  type CadastroIbcMode,
} from "../components/CadastroIbcModeSelector";
import CadastroIbcPoolList from "../components/CadastroIbcPoolList";
import CadastroIbcAlertsPanel from "../components/CadastroIbcAlertsPanel";
import CadastroIbcSectionError from "../components/CadastroIbcSectionError";
import CadastroIbcSectionSkeleton from "../components/CadastroIbcSectionSkeleton";
import { ibcCadastroService } from "../services/ibcCadastroService";
import type { CreateLoteIbcResultDTO } from "../types/ibcCadastro.types";
import { canAccessIbcCadastro } from "../utils/canAccessIbcCadastro";
import { toError } from "../utils/toError";

const POOL_KEY = ["ibc", "pool"] as const;
const ALERTS_KEY = ["ibc", "alerts"] as const;

export default function CadastroIbcView() {
  const { user } = useAuth();
  const allowed = canAccessIbcCadastro(user?.role);
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<CadastroIbcMode>("unitario");

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

  const invalidateLists = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: POOL_KEY }),
      queryClient.invalidateQueries({ queryKey: ALERTS_KEY }),
    ]);
  };

  const createMutation = useMutation({
    mutationFn: ibcCadastroService.createNovo,
    onSuccess: async (created) => {
      toast.success(`IBC ${created.identificador} cadastrado`);
      await invalidateLists();
    },
    onError: (err) => {
      toast.error(toError(err).message || "Falha ao cadastrar IBC");
    },
  });

  const createLoteMutation = useMutation({
    mutationFn: ibcCadastroService.createLote,
    onSuccess: async (result) => {
      toast.success(`Lote com ${result.items.length} IBCs cadastrado`);
      await invalidateLists();
    },
    onError: (err) => {
      toast.error(toError(err).message || "Falha ao cadastrar lote de IBC");
    },
  });

  if (!allowed) {
    return (
      <ExpedicaoIbcAccessDeniedAlert targetPhrase="o Cadastro IBC" />
    );
  }

  const alertsCount = alertsQuery.data?.length;
  const poolCount = poolQuery.data?.length;
  const loteResult: CreateLoteIbcResultDTO | undefined =
    createLoteMutation.data;
  const submitting =
    createMutation.isPending || createLoteMutation.isPending;

  return (
    <DefaultLayout>
      <div className="space-y-6 p-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Cadastro IBC</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Novo IBC nasce Inapto / Aguardando inspeção com identificador HM
            automático. Lote de compra gera N unidades com a mesma data limite.
          </p>
        </div>

        <section className="rounded-lg border border-border bg-card p-4 shadow-sm sm:p-6">
          <h2 className="mb-3 text-base font-semibold tracking-tight">
            Novo IBC
          </h2>
          <CadastroIbcModeSelector
            mode={mode}
            disabled={submitting}
            onChange={setMode}
          />
          {mode === "unitario" ? (
            <CadastroIbcForm
              submitting={createMutation.isPending}
              onSubmit={async (dataLimite) => {
                await createMutation.mutateAsync({ dataLimite });
              }}
            />
          ) : (
            <CadastroIbcLoteForm
              submitting={createLoteMutation.isPending}
              onSubmit={async (input) => {
                await createLoteMutation.mutateAsync(input);
              }}
            />
          )}
          {mode === "unitario" &&
          createMutation.isSuccess &&
          createMutation.data ? (
            <div
              role="status"
              className="mt-4 flex items-start gap-2 rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-sm"
            >
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <p>
                IBC cadastrado:{" "}
                <span className="font-semibold text-foreground">
                  {createMutation.data.identificador}
                </span>
              </p>
            </div>
          ) : null}
          {mode === "lote" && createLoteMutation.isSuccess && loteResult ? (
            <>
              <div
                role="status"
                className="mt-4 flex items-start gap-2 rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-sm"
              >
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div>
                  <p>
                    Lote cadastrado:{" "}
                    <span className="font-semibold text-foreground">
                      {loteResult.items.length} IBCs
                    </span>
                    {loteResult.lote.numeroNf
                      ? ` · NF ${loteResult.lote.numeroNf}`
                      : null}
                  </p>
                  <p className="mt-1 text-muted-foreground">
                    {loteResult.items.map((item) => item.identificador).join(", ")}
                  </p>
                </div>
              </div>
              {loteResult.warning ? (
                <CadastroIbcLoteWarningBanner warning={loteResult.warning} />
              ) : null}
            </>
          ) : null}
        </section>

        <section className="rounded-lg border border-border bg-muted/20 p-4 shadow-sm sm:p-6">
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">
            Alertas
            {typeof alertsCount === "number" ? ` (${alertsCount})` : null}
          </h2>
          {alertsQuery.isLoading ? (
            <CadastroIbcSectionSkeleton rows={3} />
          ) : alertsQuery.error ? (
            <CadastroIbcSectionError
              message={toError(alertsQuery.error).message}
              onRetry={() => {
                void alertsQuery.refetch();
              }}
            />
          ) : (
            <CadastroIbcAlertsPanel alerts={alertsQuery.data ?? []} />
          )}
        </section>

        <section className="rounded-lg border border-border bg-muted/20 p-4 shadow-sm sm:p-6">
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">
            Pool ativo
            {typeof poolCount === "number" ? ` (${poolCount})` : null}
          </h2>
          {poolQuery.isLoading ? (
            <CadastroIbcSectionSkeleton />
          ) : poolQuery.error ? (
            <CadastroIbcSectionError
              message={toError(poolQuery.error).message}
              onRetry={() => {
                void poolQuery.refetch();
              }}
            />
          ) : (
            <CadastroIbcPoolList items={poolQuery.data ?? []} />
          )}
        </section>
      </div>
    </DefaultLayout>
  );
}
