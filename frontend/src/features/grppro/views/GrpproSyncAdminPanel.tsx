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
import { GrpproSyncRunsTable } from "../components/GrpproSyncRunsTable";
import {
  useGrpproSyncRuns,
  useGrpproSyncStatus,
  useStartGrpproSync,
} from "../hooks/useGrpproSyncAdmin";
import type { GrpproSyncRun } from "../types/grpproSync.types";

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
  runs: GrpproSyncRun[],
  lastSuccessfulSyncAt: string | null | undefined,
  lastRowCount: number | null | undefined,
): AdminMetric[] {
  const failedRuns = runs.filter((run) => run.status === "FAILED").length;
  const runningRuns = runs.filter((run) => run.status === "RUNNING").length;

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
      label: "Linhas syncadas",
      value: lastRowCount != null ? String(lastRowCount) : "—",
      tone: lastRowCount != null ? "success" : "warning",
    },
    {
      label: "Último sync válido",
      value: formatTimestamp(lastSuccessfulSyncAt),
      tone: lastSuccessfulSyncAt ? "success" : "warning",
    },
  ];
}

function buildEvents(runs: GrpproSyncRun[]): AdminEvent[] {
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
        detail: `Run ${run.id} terminou com status ${run.status}${
          run.rowCount != null ? ` (${run.rowCount} linhas)` : ""
        }`,
        occurredAt: formatTimestamp(run.finishedAt),
        timestamp: parseTimestamp(run.finishedAt),
        severity: finishedSeverity,
      });
    }

    if (run.status === "FAILED" && run.error) {
      events.push({
        id: `${run.id}-error`,
        title: "Erro de sincronização",
        detail: run.error,
        occurredAt: formatTimestamp(run.finishedAt ?? run.startedAt),
        timestamp: parseTimestamp(run.finishedAt ?? run.startedAt),
        severity: "danger",
      });
    }
  }

  return events
    .sort((first, second) => second.timestamp - first.timestamp)
    .slice(0, EVENT_LIMIT);
}

export function GrpproSyncAdminPanel() {
  const statusQuery = useGrpproSyncStatus();
  const runsQuery = useGrpproSyncRuns();
  const { startSync, isStarting } = useStartGrpproSync();
  const runs = runsQuery.data ?? [];

  const metrics = useMemo(
    () =>
      buildMetrics(
        runs,
        statusQuery.data?.lastSuccessfulSyncAt,
        statusQuery.data?.lastRowCount,
      ),
    [runs, statusQuery.data?.lastSuccessfulSyncAt, statusQuery.data?.lastRowCount],
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
              GrpPro Sync Control Center
            </CardTitle>
            <CardDescription className="max-w-[85ch] text-sm">
              Painel operacional para monitorar a replicação do mapa grppro (ERP →
              Postgres) e acionar sync manual do espelho produto_grupo_map.
            </CardDescription>
            <p className={`text-xs font-medium ${healthToneClass}`}>
              Run ativo: {statusQuery.data?.activeRunId ?? "nenhum"} | Linhas publicadas:{" "}
              {statusQuery.data?.lastRowCount ?? "—"}
              {statusQuery.data?.lastError
                ? ` | Último erro: ${statusQuery.data.lastError}`
                : ""}
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

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
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
            <CardTitle className="text-base">Histórico de runs</CardTitle>
            <CardDescription>
              Execuções atômicas do job GrpProSync (sem steps intermediários).
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
              <GrpproSyncRunsTable runs={runs} />
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
