import type { SeniorStepExecutor } from "./ports";
import { materializeOverviewCustomerIdentity } from "./materializeOverviewCustomerIdentity";
import { OverviewCustomerIdentitySeniorQuery } from "./OverviewCustomerIdentitySeniorQuery";
import { materializeOverviewCustomerCommercialSummary } from "./materializeOverviewCustomerCommercialSummary";
import { OverviewCustomerCommercialSummarySeniorQuery } from "./OverviewCustomerCommercialSummarySeniorQuery";
import { materializeOverviewCustomerMonthlyEvolution } from "./materializeOverviewCustomerMonthlyEvolution";
import { OverviewCustomerMonthlyEvolutionSeniorQuery } from "./OverviewCustomerMonthlyEvolutionSeniorQuery";
import { materializeOverviewCustomerPurchasedProducts } from "./materializeOverviewCustomerPurchasedProducts";
import { OverviewCustomerPurchasedProductsSeniorQuery } from "./OverviewCustomerPurchasedProductsSeniorQuery";
import { materializeOverviewCustomerRecentCommercialMotion } from "./materializeOverviewCustomerRecentCommercialMotion";
import { OverviewCustomerRecentCommercialMotionSeniorQuery } from "./OverviewCustomerRecentCommercialMotionSeniorQuery";

const STEP_NAMES = [
  "dados-gerais-cliente",
  "resumo-comercial",
  "evolucao-mensal",
  "produtos-comprados",
  "ultimo-pedido-cliente",
] as const;

export function createOverviewCustomerSyncSteps(
  identityQuery: Pick<OverviewCustomerIdentitySeniorQuery, "fetchSeed"> =
    new OverviewCustomerIdentitySeniorQuery(),
  commercialSummaryQuery: Pick<
    OverviewCustomerCommercialSummarySeniorQuery,
    "fetchSeed"
  > = new OverviewCustomerCommercialSummarySeniorQuery(),
  monthlyEvolutionQuery: Pick<OverviewCustomerMonthlyEvolutionSeniorQuery, "fetchSeed"> =
    new OverviewCustomerMonthlyEvolutionSeniorQuery(),
  purchasedProductsQuery: Pick<OverviewCustomerPurchasedProductsSeniorQuery, "fetchSeed"> =
    new OverviewCustomerPurchasedProductsSeniorQuery(),
  recentCommercialMotionQuery: Pick<
    OverviewCustomerRecentCommercialMotionSeniorQuery,
    "fetchSeed"
  > = new OverviewCustomerRecentCommercialMotionSeniorQuery(),
): SeniorStepExecutor[] {
  const identityStep: SeniorStepExecutor = {
    name: STEP_NAMES[0],
    execute: async () => {
      const seed = await identityQuery.fetchSeed();
      const snapshot = materializeOverviewCustomerIdentity(seed);

      return {
        customers: snapshot.customers,
        metadata: {
          customerCount: Object.keys(snapshot.customers).length,
          generatedAt: new Date().toISOString(),
        },
      };
    },
  };

  const summaryStep: SeniorStepExecutor = {
    name: STEP_NAMES[1],
    execute: async () => {
      const seed = await commercialSummaryQuery.fetchSeed();
      const snapshot = materializeOverviewCustomerCommercialSummary(seed);

      return {
        customers: snapshot.customers,
        metadata: {
          customerCount: Object.keys(snapshot.customers).length,
          generatedAt: new Date().toISOString(),
        },
      };
    },
  };

  const monthlyEvolutionStep: SeniorStepExecutor = {
    name: STEP_NAMES[2],
    execute: async () => {
      const seed = await monthlyEvolutionQuery.fetchSeed();
      const snapshot = materializeOverviewCustomerMonthlyEvolution(seed);

      return {
        customers: snapshot.customers,
        metadata: {
          customerCount: Object.keys(snapshot.customers).length,
          generatedAt: new Date().toISOString(),
        },
      };
    },
  };

  const purchasedProductsStep: SeniorStepExecutor = {
    name: STEP_NAMES[3],
    execute: async () => {
      const seed = await purchasedProductsQuery.fetchSeed();
      const snapshot = materializeOverviewCustomerPurchasedProducts(seed);

      return {
        customers: snapshot.customers,
        metadata: {
          customerCount: Object.keys(snapshot.customers).length,
          generatedAt: new Date().toISOString(),
        },
      };
    },
  };

  const recentCommercialMotionStep: SeniorStepExecutor = {
    name: STEP_NAMES[4],
    execute: async () => {
      const seed = await recentCommercialMotionQuery.fetchSeed();
      const snapshot = materializeOverviewCustomerRecentCommercialMotion(seed);

      return {
        customers: snapshot.customers,
        metadata: {
          customerCount: Object.keys(snapshot.customers).length,
          generatedAt: new Date().toISOString(),
        },
      };
    },
  };

  return [
    identityStep,
    summaryStep,
    monthlyEvolutionStep,
    purchasedProductsStep,
    recentCommercialMotionStep,
  ];
}
