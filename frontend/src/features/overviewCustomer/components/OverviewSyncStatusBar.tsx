import { Button } from "@/components/ui/button";
import type { OverviewSyncStatus } from "../types/overviewSync.types";

type OverviewSyncStatusBarProps = {
  status: OverviewSyncStatus | undefined;
  isLoading: boolean;
  onRefresh: () => void;
};

function formatTimestamp(value: string | null): string {
  if (!value) {
    return "Nunca";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString("pt-BR");
}

export function OverviewSyncStatusBar({
  status,
  isLoading,
  onRefresh,
}: OverviewSyncStatusBarProps) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4 rounded-md border border-border bg-muted/30 px-4 py-3">
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">Último sync bem-sucedido</p>
        <p className="text-lg font-semibold">
          {isLoading
            ? "Carregando…"
            : formatTimestamp(status?.lastSuccessfulSyncAt ?? null)}
        </p>
        <p className="text-xs text-muted-foreground">
          Snapshot: {status?.servedSnapshotId ?? "—"}
          {status?.activeRunId ? ` · Run ativo: ${status.activeRunId}` : ""}
        </p>
      </div>
      <Button type="button" onClick={onRefresh}>
        Atualizar
      </Button>
    </div>
  );
}
