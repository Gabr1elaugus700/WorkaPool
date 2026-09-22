import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { OverviewCustomerAbcGroupsResponse } from "../../types/overviewCustomerAbcGroups.types";
import { OverviewCustomerGroupAnalysisSection } from "./OverviewCustomerGroupAnalysisSection";

const CUSTOMER_CODE = 123;
const QUERY_KEY = ["overview-customer-abc-groups", CUSTOMER_CODE];

const SAMPLE_RESPONSE: OverviewCustomerAbcGroupsResponse = {
  customerCode: CUSTOMER_CODE,
  grupos: [
    { grupoCodigo: "G01", grupoDescricao: "Grupo A", revenueShare: 42 },
    { grupoCodigo: "OUTROS", grupoDescricao: "OUTROS PRODUTOS", revenueShare: 18 },
  ],
};

function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: Infinity,
        gcTime: Infinity,
        networkMode: "offline",
        refetchOnMount: false,
        refetchOnReconnect: false,
        refetchOnWindowFocus: false,
      },
    },
  });
}

function seedSuccessQuery(client: QueryClient, data: OverviewCustomerAbcGroupsResponse): void {
  client.setQueryData(QUERY_KEY, data);
}

function seedLoadingQuery(client: QueryClient): void {
  const query = client.getQueryCache().build(client, {
    queryKey: QUERY_KEY,
    queryFn: () => new Promise<OverviewCustomerAbcGroupsResponse>(() => undefined),
  });
  query.setState({
    data: undefined,
    error: null,
    status: "pending",
    fetchStatus: "fetching",
    dataUpdatedAt: 0,
    errorUpdatedAt: 0,
  });
}

function renderSection(
  client: QueryClient,
  options?: {
    activeTab?: "overview" | "history" | "products" | "motion";
    childMarker?: string;
  },
): string {
  const activeTab = options?.activeTab ?? "overview";
  const childMarker = options?.childMarker ?? "analysis-ready";

  return renderToStaticMarkup(
    React.createElement(
      QueryClientProvider,
      { client },
      React.createElement(OverviewCustomerGroupAnalysisSection, {
        customerCode: CUSTOMER_CODE,
        activeTab,
        children: ({ grupoCodigo }) =>
          React.createElement("p", null, `${childMarker}:${grupoCodigo}`),
      }),
    ),
  );
}

describe("OverviewCustomerGroupAnalysisSection", () => {
  it("does not render when the overview tab is not active", () => {
    const client = createQueryClient();
    seedSuccessQuery(client, SAMPLE_RESPONSE);

    const markup = renderSection(client, { activeTab: "products" });

    assert.equal(markup, "");
  });

  it("renders loading state while grupos are fetching", () => {
    const client = createQueryClient();
    seedLoadingQuery(client);

    const markup = renderSection(client);

    assert.match(markup, /Carregando grupos ABC deste cliente/i);
    assert.doesNotMatch(markup, /analysis-ready/);
  });

  it("renders empty state without calling children when grupos is empty", () => {
    const client = createQueryClient();
    seedSuccessQuery(client, { customerCode: CUSTOMER_CODE, grupos: [] });

    const markup = renderSection(client);

    assert.match(markup, /Nenhum grupo disponível para análise/i);
    assert.doesNotMatch(markup, /analysis-ready/);
  });

  it("selects the first chip and passes grupoCodigo to children", () => {
    const client = createQueryClient();
    seedSuccessQuery(client, SAMPLE_RESPONSE);

    const markup = renderSection(client);

    assert.match(markup, /Grupo A/);
    assert.match(markup, /OUTROS PRODUTOS/);
    assert.match(markup, /analysis-ready:G01/);
  });
});
