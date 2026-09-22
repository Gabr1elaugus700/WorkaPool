import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye, MoreVertical } from "lucide-react";
import { Link } from "react-router-dom";
import type { OverviewCustomerListRow } from "../types/overviewCustomerList.types";

type OverviewCustomerPortfolioListProps = {
  items: OverviewCustomerListRow[];
  isLoading: boolean;
};

export function OverviewCustomerPortfolioList({
  items,
  isLoading,
}: OverviewCustomerPortfolioListProps) {
  const formatLastPurchase = (value: string | null): { date: string; relative: string } => {
    if (!value) {
      return { date: "-", relative: "Sem compras recentes" };
    }

    const [yearRaw, monthRaw, dayRaw] = value.split("-");
    const year = Number(yearRaw);
    const month = Number(monthRaw);
    const day = Number(dayRaw);

    if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
      return { date: value, relative: "Data invalida" };
    }

    const purchaseDate = new Date(year, month - 1, day);
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const purchaseStart = new Date(
      purchaseDate.getFullYear(),
      purchaseDate.getMonth(),
      purchaseDate.getDate(),
    );
    const daysDiff = Math.floor(
      (todayStart.getTime() - purchaseStart.getTime()) / (1000 * 60 * 60 * 24),
    );

    const relative =
      daysDiff <= 0 ? "Hoje" : daysDiff === 1 ? "Ontem" : `Ha ${daysDiff} dias`;

    return {
      date: new Intl.DateTimeFormat("pt-BR").format(purchaseDate),
      relative,
    };
  };

  const getBranchBadgeClass = (branch: OverviewCustomerListRow["branchIndicator"]): string => {
    if (branch === "MGA") {
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    }
    if (branch === "CTB") {
      return "border-violet-200 bg-violet-50 text-violet-700";
    }
    return "border-cyan-200 bg-cyan-50 text-cyan-700";
  };

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando carteira…</p>;
  }

  if (items.length === 0) {
    return (
      <section className="rounded-md border p-5">
        <h2 className="text-lg font-semibold">Nenhum cliente encontrado na carteira</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Ajuste os filtros de busca ou aguarde a próxima sincronização.
        </p>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-xl border border-border/80 bg-card">
      <Table className="[&_td]:py-3 [&_th]:py-3">
        <TableHeader className="bg-muted/35">
          <TableRow>
            <TableHead className="w-24 text-xs uppercase tracking-wide text-muted-foreground">
              Codigo
            </TableHead>
            <TableHead className="text-xs uppercase tracking-wide text-muted-foreground">
              Razao social / Nome fantasia
            </TableHead>
            <TableHead className="text-xs uppercase tracking-wide text-muted-foreground">
              Cidade / UF
            </TableHead>
            <TableHead className="text-xs uppercase tracking-wide text-muted-foreground">
              Filial
            </TableHead>
            <TableHead className="text-xs uppercase tracking-wide text-muted-foreground">
              Ultima compra
            </TableHead>
            <TableHead className="text-xs uppercase tracking-wide text-muted-foreground">
              Status
            </TableHead>
            <TableHead className="w-24 text-right text-xs uppercase tracking-wide text-muted-foreground">
              Acoes
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => {
            const initials = item.tradeName
              .split(" ")
              .filter((word) => word.length > 0)
              .slice(0, 2)
              .map((word) => word[0]?.toUpperCase() ?? "")
              .join("");
            const { date, relative } = formatLastPurchase(item.lastPurchaseAt);
            const isActive =
              item.daysSinceLastPurchase != null ? item.daysSinceLastPurchase <= 90 : true;

            return (
              <TableRow key={item.customerCode}>
                <TableCell>
                  <Link
                    to={`/overview/customers/${item.customerCode}`}
                    className="inline-flex rounded-md bg-muted px-2 py-1 text-xs font-semibold text-foreground transition-colors hover:bg-muted/80"
                  >
                    #{item.customerCode}
                  </Link>
                </TableCell>
                <TableCell>
                  <Link
                    to={`/overview/customers/${item.customerCode}`}
                    className="group flex items-start gap-3"
                  >
                    <span className="mt-0.5 inline-flex size-7 items-center justify-center rounded-md bg-emerald-100 text-[11px] font-semibold text-emerald-700">
                      {initials || "CL"}
                    </span>
                    <span className="space-y-1">
                      <span className="block text-sm font-semibold text-foreground group-hover:text-primary">
                        {item.tradeName}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        Cliente {item.customerCode}
                      </span>
                    </span>
                  </Link>
                </TableCell>
                <TableCell className="text-sm text-foreground">
                  {item.city}/{item.state}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={getBranchBadgeClass(item.branchIndicator)}
                  >
                    {item.branchIndicator}
                  </Badge>
                </TableCell>
                <TableCell>
                  <p className="text-sm font-medium tabular-nums text-foreground">{date}</p>
                  <p className="text-xs text-muted-foreground">{relative}</p>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={
                      isActive
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-amber-200 bg-amber-50 text-amber-700"
                    }
                  >
                    {isActive ? "Ativo" : "Inativo"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <Button asChild variant="ghost" size="icon" className="h-8 w-8">
                      <Link to={`/overview/customers/${item.customerCode}`} aria-label="Ver cliente">
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground"
                      aria-label="Mais acoes"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </section>
  );
}
