import type { SeniorStepExecutor } from "./ports";
import { materializeOverviewCustomerIdentity } from "./materializeOverviewCustomerIdentity";
import { OverviewCustomerIdentitySeniorQuery } from "./OverviewCustomerIdentitySeniorQuery";

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
  identityQuery: OverviewCustomerIdentitySeniorQuery = new OverviewCustomerIdentitySeniorQuery(),
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

  return [
    identityStep,
    createPendingWiringStep(STEP_NAMES[1]),
    createPendingWiringStep(STEP_NAMES[2]),
    createPendingWiringStep(STEP_NAMES[3]),
    createPendingWiringStep(STEP_NAMES[4]),
  ];
}
