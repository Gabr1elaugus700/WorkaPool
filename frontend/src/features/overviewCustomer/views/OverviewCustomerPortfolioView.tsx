import DefaultLayout from "@/layout/DefaultLayout";
import { useState } from "react";
import { OverviewCustomerPortfolioList } from "../components/OverviewCustomerPortfolioList";
import { useOverviewCustomerList } from "../hooks/useOverviewCustomerList";

export function OverviewCustomerPortfolioView() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const listQuery = useOverviewCustomerList(search, page);
  const pagination = listQuery.data?.pagination;

  return (
    <DefaultLayout>
      <section className="space-y-4">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold">Carteira de clientes</h1>
          <p className="text-sm text-muted-foreground">
            Busque por codigo, nome/fantasia ou documento para abrir o detalhe.
          </p>
        </header>

        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            setPage(1);
            setSearch(searchInput.trim());
          }}
        >
          <input
            type="text"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Buscar por codigo, nome ou documento"
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground"
          >
            Buscar
          </button>
        </form>

        {listQuery.isError ? (
          <p className="text-sm text-destructive">
            Nao foi possivel carregar a carteira de clientes.
          </p>
        ) : (
          <OverviewCustomerPortfolioList
            items={listQuery.data?.items ?? []}
            isLoading={listQuery.isLoading}
          />
        )}

        <footer className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Pagina {pagination?.page ?? page} de {pagination?.totalPages ?? 1}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={(pagination?.page ?? page) <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className="rounded-md border px-3 py-1 disabled:opacity-50"
            >
              Anterior
            </button>
            <button
              type="button"
              disabled={!pagination?.hasNextPage}
              onClick={() => setPage((current) => current + 1)}
              className="rounded-md border px-3 py-1 disabled:opacity-50"
            >
              Proxima
            </button>
          </div>
        </footer>
      </section>
    </DefaultLayout>
  );
}

export default OverviewCustomerPortfolioView;
