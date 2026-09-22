import DefaultLayout from "@/layout/DefaultLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Download, Filter, Search, Store, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { OverviewCustomerPortfolioList } from "../components/OverviewCustomerPortfolioList";
import { useOverviewCustomerList } from "../hooks/useOverviewCustomerList";

const QUICK_FILTER_OPTIONS = [
  { id: "24h", label: "Ultimas 24h" },
  { id: "mga", label: "Somente Maringa (MGA)" },
  { id: "30d", label: "Clientes sem compra ha 30d" },
] as const;

type QuickFilterId = (typeof QUICK_FILTER_OPTIONS)[number]["id"] | "none";

export function OverviewCustomerPortfolioView() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [branchFilter, setBranchFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");
  const [quickFilter, setQuickFilter] = useState<QuickFilterId>("none");

  const listQuery = useOverviewCustomerList(search, page);
  const pagination = listQuery.data?.pagination;
  const queryItems = listQuery.data?.items;
  const items = useMemo(() => queryItems ?? [], [queryItems]);

  const cityOptions = useMemo(() => {
    return Array.from(
      new Set(items.map((item) => `${item.city}/${item.state}`.trim()).filter(Boolean)),
    ).sort((first, second) => first.localeCompare(second, "pt-BR"));
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (branchFilter !== "all" && item.branchIndicator !== branchFilter) {
        return false;
      }

      const cityLabel = `${item.city}/${item.state}`;
      if (cityFilter !== "all" && cityLabel !== cityFilter) {
        return false;
      }

      if (quickFilter === "24h") {
        return item.daysSinceLastPurchase != null && item.daysSinceLastPurchase <= 1;
      }

      if (quickFilter === "mga") {
        return item.branchIndicator === "MGA";
      }

      if (quickFilter === "30d") {
        return item.daysSinceLastPurchase != null && item.daysSinceLastPurchase >= 30;
      }

      return true;
    });
  }, [branchFilter, cityFilter, items, quickFilter]);

  const metrics = useMemo(() => {
    return {
      totalCustomers: pagination?.totalItems ?? items.length,
      purchasesThisMonth: listQuery.data?.summary?.purchasesThisMonth ?? 0,
      branchCount: listQuery.data?.summary?.branchCount ?? { BOTH: 0, MGA: 0, CTB: 0 },
    };
  }, [
    items.length,
    listQuery.data?.summary?.branchCount,
    listQuery.data?.summary?.purchasesThisMonth,
    pagination?.totalItems,
  ]);

  return (
    <DefaultLayout>
      <section className="mx-auto flex w-full max-w-[1400px] flex-col gap-4 px-3 py-6 md:px-6">
        <header className="space-y-3 rounded-xl border border-border/70 bg-card p-4 shadow-sm md:p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight">Carteira de clientes</h1>
                <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                  {metrics.totalCustomers} clientes cadastrados
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Consulte informacoes cadastrais, status operacional e historico consolidado por
                filial.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="gap-1.5 border-cyan-200 bg-cyan-50 text-cyan-700">
                <Store className="h-3.5 w-3.5" />
                Portfolio operacional
              </Badge>
              <Button type="button" variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Exportar planilha (XLS)
              </Button>
            </div>
          </div>
        </header>

        <div className="grid gap-3 md:grid-cols-3">
          <Card className="border-border/80">
            <CardContent className="space-y-1 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Total na carteira</p>
              <p className="text-3xl font-semibold tracking-tight">{metrics.totalCustomers}</p>
              <p className="text-xs text-muted-foreground">Maringa e Curitiba</p>
            </CardContent>
          </Card>
          <Card className="border-border/80">
            <CardContent className="space-y-1 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Compraram este mes</p>
              <p className="flex items-center gap-2 text-3xl font-semibold tracking-tight">
                {metrics.purchasesThisMonth}
                <Users className="h-5 w-5 text-primary" />
              </p>
              <p className="text-xs text-muted-foreground">Faturamento recorrente ativo</p>
            </CardContent>
          </Card>
          <Card className="border-border/80">
            <CardContent className="space-y-1 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Filiais operantes</p>
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="outline" className="border-cyan-200 bg-cyan-50 text-cyan-700">
                  Ambas: {metrics.branchCount.BOTH}
                </Badge>
                <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                  MGA: {metrics.branchCount.MGA}
                </Badge>
                <Badge variant="outline" className="border-violet-200 bg-violet-50 text-violet-700">
                  CTB: {metrics.branchCount.CTB}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">Cobertura em 3 regioes industriais</p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-border/80">
          <CardContent className="space-y-4 p-4">
            <form
              className="grid gap-2 lg:grid-cols-[minmax(280px,1fr)_220px_220px_140px_110px]"
              onSubmit={(event) => {
                event.preventDefault();
                setPage(1);
                setSearch(searchInput.trim());
              }}
            >
              <label htmlFor="overview-search" className="sr-only">
                Buscar cliente
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="overview-search"
                  type="text"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Buscar por codigo, razao social, nome fantasia ou documento"
                  className="pl-9"
                />
              </div>

              <Select value={branchFilter} onValueChange={setBranchFilter}>
                <SelectTrigger aria-label="Filtrar por filial">
                  <SelectValue placeholder="Todas as filiais" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as filiais</SelectItem>
                  <SelectItem value="BOTH">Ambas</SelectItem>
                  <SelectItem value="MGA">MGA</SelectItem>
                  <SelectItem value="CTB">CTB</SelectItem>
                </SelectContent>
              </Select>

              <Select value={cityFilter} onValueChange={setCityFilter}>
                <SelectTrigger aria-label="Filtrar por cidade">
                  <SelectValue placeholder="Todas as cidades/UF" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as cidades/UF</SelectItem>
                  {cityOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button type="submit" className="gap-2">
                <Filter className="h-4 w-4" />
                Filtrar
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSearchInput("");
                  setSearch("");
                  setPage(1);
                  setBranchFilter("all");
                  setCityFilter("all");
                  setQuickFilter("none");
                }}
              >
                Limpar
              </Button>
            </form>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted-foreground">Atalhos rapidos:</span>
                {QUICK_FILTER_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() =>
                      setQuickFilter((current) => (current === option.id ? "none" : option.id))
                    }
                    className={cn(
                      "rounded-md border px-2.5 py-1 text-xs transition-colors",
                      quickFilter === option.id
                        ? "border-primary/40 bg-primary/10 text-primary"
                        : "border-border bg-background text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">Ordenacao: Mais recente</p>
            </div>
          </CardContent>
        </Card>

        {listQuery.isError ? (
          <p className="text-sm text-destructive">
            Nao foi possivel carregar a carteira de clientes.
          </p>
        ) : (
          <OverviewCustomerPortfolioList
            items={filteredItems}
            isLoading={listQuery.isLoading}
          />
        )}

        <footer className="flex flex-col gap-2 text-sm md:flex-row md:items-center md:justify-between">
          <span className="text-muted-foreground">
            Pagina {pagination?.page ?? page} de {pagination?.totalPages ?? 1}
          </span>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={(pagination?.page ?? page) <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              Anterior
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={!pagination?.hasNextPage}
              onClick={() => setPage((current) => current + 1)}
            >
              Proxima
            </Button>
          </div>
        </footer>
      </section>
    </DefaultLayout>
  );
}

export default OverviewCustomerPortfolioView;
