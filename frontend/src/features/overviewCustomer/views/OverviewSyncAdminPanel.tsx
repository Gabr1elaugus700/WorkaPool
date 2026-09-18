import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { OverviewSyncRunsTable } from "../components/OverviewSyncRunsTable";
import {
  useOverviewSyncStatus,
  useOverviewSyncRuns,
  useRetryOverviewSyncFailedStep,
  useStartOverviewSync,
} from "../hooks/useOverviewSyncAdmin";
import type { OverviewSyncRun } from "../types/overviewSync.types";

type AdminMetric = {
  label: string;
  value: string;
  tone?: "default" | "success" | "warning" | "danger";
};

type AdminEvent = {
  id: string;
  title: string;
  detail: string;
  occurredAt: string;
  timestamp: number;
  severity: "info" | "success" | "warning" | "danger";
};

const EVENT_LIMIT = 14;

function parseTimestamp(value: string | undefined): number {
  if (!value) {
    return 0;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 0;
  }
  return date.getTime();
}

function formatTimestamp(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString("pt-BR");
}

function getMetricToneClass(tone: AdminMetric["tone"]): string {
  if (tone === "success") {
    return "border-emerald-500/30 bg-emerald-500/10";
  }
  if (tone === "warning") {
    return "border-amber-500/30 bg-amber-500/10";
  }
  if (tone === "danger") {
    return "border-destructive/40 bg-destructive/10";
  }
  return "border-border bg-card";
}

function getEventBadgeVariant(
  severity: AdminEvent["severity"],
): "default" | "secondary" | "destructive" | "outline" {
  if (severity === "danger") {
    return "destructive";
  }
  if (severity === "warning") {
    return "secondary";
  }
  if (severity === "success") {
    return "default";
  }
  return "outline";
}

function buildMetrics(
  runs: OverviewSyncRun[],
  lastSuccessfulSyncAt: string | null | undefined,
): AdminMetric[] {
  const failedRuns = runs.filter((run) => run.status === "FAILED").length;
  const runningRuns = runs.filter((run) => run.status === "RUNNING").length;
  const failedSteps = runs.reduce((total, run) => {
    const failedInRun = run.steps.filter((step) => step.status === "FAILED").length;
    return total + failedInRun;
  }, 0);
  const retriedSteps = runs.reduce((total, run) => {
    const retriedInRun = run.steps.filter((step) => step.attemptCount > 1).length;
    return total + retriedInRun;
  }, 0);

  return [
    {
      label: "Runs monitorados",
      value: String(runs.length),
    },
    {
      label: "Runs com falha",
      value: String(failedRuns),
      tone: failedRuns > 0 ? "danger" : "success",
    },
    {
      label: "Runs em execução",
      value: String(runningRuns),
      tone: runningRuns > 0 ? "warning" : "default",
    },
    {
      label: "Steps com falha",
      value: String(failedSteps),
      tone: failedSteps > 0 ? "danger" : "success",
    },
    {
      label: "Steps retentados",
      value: String(retriedSteps),
      tone: retriedSteps > 0 ? "warning" : "default",
    },
    {
      label: "Último sync válido",
      value: formatTimestamp(lastSuccessfulSyncAt),
      tone: lastSuccessfulSyncAt ? "success" : "warning",
    },
  ];
}

function buildEvents(runs: OverviewSyncRun[]): AdminEvent[] {
  const events: AdminEvent[] = [];
  for (const run of runs) {
    events.push({
      id: `${run.id}-started`,
      title: "Run iniciado",
      detail: `Run ${run.id} iniciou processamento`,
      occurredAt: formatTimestamp(run.startedAt),
      timestamp: parseTimestamp(run.startedAt),
      severity: "info",
    });

    if (run.finishedAt) {
      const finishedSeverity: AdminEvent["severity"] =
        run.status === "FAILED"
          ? "danger"
          : run.status === "SUCCEEDED"
            ? "success"
            : "warning";
      events.push({
        id: `${run.id}-finished`,
        title:
          run.status === "SUCCEEDED" ? "Run finalizado" : "Run finalizado com alerta",
        detail: `Run ${run.id} terminou com status ${run.status}`,
        occurredAt: formatTimestamp(run.finishedAt),
        timestamp: parseTimestamp(run.finishedAt),
        severity: finishedSeverity,
      });
    }

    for (const step of run.steps) {
      if (step.status === "FAILED") {
        events.push({
          id: `${run.id}-${step.name}-failed`,
          title: "Step com erro",
          detail: `${step.name} falhou em ${step.attemptCount} tentativa(s)${
            step.lastError ? `: ${step.lastError}` : ""
          }`,
          occurredAt: formatTimestamp(step.finishedAt ?? run.finishedAt ?? run.startedAt),
          timestamp: parseTimestamp(step.finishedAt ?? run.finishedAt ?? run.startedAt),
          severity: "danger",
        });
      } else if (step.attemptCount > 1 && step.status === "SUCCEEDED") {
        events.push({
          id: `${run.id}-${step.name}-retried`,
          title: "Step recuperado",
          detail: `${step.name} estabilizou após ${step.attemptCount} tentativas`,
          occurredAt: formatTimestamp(step.finishedAt ?? run.finishedAt ?? run.startedAt),
          timestamp: parseTimestamp(step.finishedAt ?? run.finishedAt ?? run.startedAt),
          severity: "warning",
        });
      }
    }
  }

  return events
    .sort((first, second) => second.timestamp - first.timestamp)
    .slice(0, EVENT_LIMIT);
}

export function OverviewSyncAdminPanel() {
  const statusQuery = useOverviewSyncStatus();
  const runsQuery = useOverviewSyncRuns();
  const { retryFailedStep, isRetrying } = useRetryOverviewSyncFailedStep();
  const { startSync, isStarting } = useStartOverviewSync();
  const runs = runsQuery.data ?? [];

  const metrics = useMemo(
    () => buildMetrics(runs, statusQuery.data?.lastSuccessfulSyncAt),
    [runs, statusQuery.data?.lastSuccessfulSyncAt],
  );
  const events = useMemo(() => buildEvents(runs), [runs]);

  const hasActiveRun = Boolean(statusQuery.data?.activeRunId);
  const hasRecentFailure = runs.some((run) => run.status === "FAILED");
  const healthLabel = hasActiveRun
    ? "Sincronização em progresso"
    : hasRecentFailure
      ? "Falhas recentes detectadas"
      : "Operação estável";
  const healthToneClass = hasActiveRun
    ? "text-amber-600"
    : hasRecentFailure
      ? "text-destructive"
      : "text-emerald-600";

  const refresh = () => {
    void statusQuery.refetch();
    void runsQuery.refetch();
  };

  return (
    <section className="mx-auto flex w-full max-w-[1400px] flex-col gap-6 px-6 py-8">
      <Card className="border-border/80 bg-gradient-to-r from-card via-card to-muted/20">
        <CardHeader className="gap-3 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">Admin Console</Badge>
              <Badge variant={hasRecentFailure ? "destructive" : "default"}>
                {healthLabel}
              </Badge>
            </div>
            <CardTitle className="text-3xl font-semibold tracking-tight">
              Overview Sync Control Center
            </CardTitle>
            <CardDescription className="max-w-[85ch] text-sm">
              Painel operacional para monitorar execução, rastrear falhas por step e
              acionar retentativas com histórico completo de eventos.
            </CardDescription>
            <p className={`text-xs font-medium ${healthToneClass}`}>
              Run ativo: {statusQuery.data?.activeRunId ?? "nenhum"} | Snapshot atual:{" "}
              {statusQuery.data?.servedSnapshotId ?? "não publicado"}
            </p>
          </div>
          <div className="flex w-full flex-wrap items-center gap-2 md:w-auto md:justify-end">
            <Button type="button" variant="outline" onClick={refresh}>
              Atualizar sinais
            </Button>
            <Button
              type="button"
              disabled={isStarting || hasActiveRun}
              onClick={() => {
                void startSync();
              }}
            >
              {isStarting ? "Iniciando..." : "Executar sincronização"}
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {metrics.map((metric) => (
          <Card
            key={metric.label}
            className={`border ${getMetricToneClass(metric.tone)} shadow-none`}
          >
            <CardContent className="space-y-1 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {metric.label}
              </p>
              <p className="truncate text-xl font-semibold">{metric.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.25fr_2fr]">
        <Card className="border-border/80">
          <CardHeader>
            <CardTitle className="text-base">Eventos recentes</CardTitle>
            <CardDescription>
              Linha do tempo das principais ocorrências da execução.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {runsQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Coletando eventos...</p>
            ) : events.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Sem eventos recentes para exibir.
              </p>
            ) : (
              events.map((event, index) => (
                <div key={event.id} className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">{event.title}</p>
                      <Badge variant={getEventBadgeVariant(event.severity)}>
                        {event.severity.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{event.detail}</p>
                    <p className="text-xs text-muted-foreground">{event.occurredAt}</p>
                  </div>
                  {index < events.length - 1 ? <Separator /> : null}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-border/80">
          <CardHeader>
            <CardTitle className="text-base">Runs e ações por step</CardTitle>
            <CardDescription>
              Tabela de auditoria com status, erros e gatilho de retentativa.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {runsQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Carregando runs...</p>
            ) : runsQuery.isError ? (
              <p className="text-sm text-destructive">
                Não foi possível carregar os runs do sync.
              </p>
            ) : (
              <OverviewSyncRunsTable
                runs={runs}
                isRetrying={isRetrying}
                onRetryFailedStep={(runId, stepName) => {
                  void retryFailedStep(runId, stepName);
                }}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
