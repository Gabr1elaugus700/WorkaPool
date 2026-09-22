import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { OverviewSyncRun } from "../types/overviewSync.types";

type OverviewSyncRunsTableProps = {
  runs: OverviewSyncRun[];
  isRetrying: boolean;
  onRetryFailedStep: (runId: string, stepName: string) => void;
};

function formatTimestamp(value: string | undefined): string {
  if (!value) {
    return "—";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString("pt-BR");
}

export function OverviewSyncRunsTable({
  runs,
  isRetrying,
  onRetryFailedStep,
}: OverviewSyncRunsTableProps) {
  if (runs.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhum sync run registrado ainda.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {runs.map((run) => (
        <div
          key={run.id}
          className="rounded-md border border-border overflow-hidden"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 bg-muted/40 px-4 py-3">
            <div>
              <p className="font-medium">
                Run {run.id} · {run.status}
              </p>
              <p className="text-xs text-muted-foreground">
                Início {formatTimestamp(run.startedAt)}
                {run.finishedAt
                  ? ` · Fim ${formatTimestamp(run.finishedAt)}`
                  : ""}
              </p>
              {run.errorSummary ? (
                <p className="mt-1 text-xs text-destructive">{run.errorSummary}</p>
              ) : null}
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Step</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tentativas</TableHead>
                <TableHead>Erro</TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {run.steps.map((step) => (
                <TableRow key={`${run.id}-${step.name}`}>
                  <TableCell className="font-medium">{step.name}</TableCell>
                  <TableCell>{step.status}</TableCell>
                  <TableCell>{step.attemptCount}</TableCell>
                  <TableCell className="max-w-xs truncate text-xs text-muted-foreground">
                    {step.lastError ?? "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    {step.status === "FAILED" ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={isRetrying}
                        onClick={() => onRetryFailedStep(run.id, step.name)}
                      >
                        Retentar
                      </Button>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ))}
    </div>
  );
}
