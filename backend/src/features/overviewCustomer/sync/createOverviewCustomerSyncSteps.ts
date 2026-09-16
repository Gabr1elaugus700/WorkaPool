import type { SeniorStepExecutor } from "./ports";
import { materializeOverviewCustomerIdentity } from "./materializeOverviewCustomerIdentity";
import { OverviewCustomerIdentitySeniorQuery } from "./OverviewCustomerIdentitySeniorQuery";
import { materializeOverviewCustomerCommercialSummary } from "./materializeOverviewCustomerCommercialSummary";
import { OverviewCustomerCommercialSummarySeniorQuery } from "./OverviewCustomerCommercialSummarySeniorQuery";
import { materializeOverviewCustomerMonthlyEvolution } from "./materializeOverviewCustomerMonthlyEvolution";
import { OverviewCustomerMonthlyEvolutionSeniorQuery } from "./OverviewCustomerMonthlyEvolutionSeniorQuery";

const STEP_NAMES = [
  "dados-gerais-cliente",
  "resumo-comercial",
  "evolucao-mensal",
  "produtos-comprados",
  "ultimo-pedido-cliente",
] as const;

function createPendingWiringStep(name: string): SeniorStepExecutor {
  return {
    name,
    execute: async () => ({
      status: "PENDING_WIRING",
      message: `Step ${name} ainda depende de integração final com query Senior dedicada.`,
    }),
  };
}

export function createOverviewCustomerSyncSteps(
  identityQuery: Pick<OverviewCustomerIdentitySeniorQuery, "fetchSeed"> =
    new OverviewCustomerIdentitySeniorQuery(),
  commercialSummaryQuery: Pick<
    OverviewCustomerCommercialSummarySeniorQuery,
    "fetchSeed"
  > = new OverviewCustomerCommercialSummarySeniorQuery(),
  monthlyEvolutionQuery: Pick<OverviewCustomerMonthlyEvolutionSeniorQuery, "fetchSeed"> =
    new OverviewCustomerMonthlyEvolutionSeniorQuery(),
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

  return [
    identityStep,
    summaryStep,
    monthlyEvolutionStep,
    createPendingWiringStep(STEP_NAMES[3]),
    createPendingWiringStep(STEP_NAMES[4]),
  ];
}
