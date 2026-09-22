import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { GrpproSyncRun } from "../types/grpproSync.types";

type GrpproSyncRunsTableProps = {
  runs: GrpproSyncRun[];
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

export function GrpproSyncRunsTable({ runs }: GrpproSyncRunsTableProps) {
  if (runs.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhum sync run registrado ainda.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-md border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Run</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Linhas</TableHead>
            <TableHead>Início</TableHead>
            <TableHead>Fim</TableHead>
            <TableHead>Erro</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {runs.map((run) => (
            <TableRow key={run.id}>
              <TableCell className="font-mono text-xs">{run.id}</TableCell>
              <TableCell>{run.status}</TableCell>
              <TableCell>{run.rowCount ?? "—"}</TableCell>
              <TableCell className="text-xs">
                {formatTimestamp(run.startedAt)}
              </TableCell>
              <TableCell className="text-xs">
                {formatTimestamp(run.finishedAt)}
              </TableCell>
              <TableCell className="max-w-xs truncate text-xs text-destructive">
                {run.error ?? "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
