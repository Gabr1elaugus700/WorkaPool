import { getPrismaClient } from "../../../config/prisma";
import { OverviewCustomerSyncRepository } from "../repositories/OverviewCustomerSyncRepository";
import { OverviewCustomerSyncPipeline } from "./OverviewCustomerSyncPipeline";
import { createOverviewCustomerSyncSteps } from "./createOverviewCustomerSyncSteps";
import { fetchProdutoGrupoMap } from "./fetchProdutoGrupoMap";

export function createOverviewCustomerSyncRuntime(
  prisma = getPrismaClient(),
): {
  store: OverviewCustomerSyncRepository;
  pipeline: OverviewCustomerSyncPipeline;
} {
  const store = new OverviewCustomerSyncRepository(prisma);
  const pipeline = new OverviewCustomerSyncPipeline(
    store,
    createOverviewCustomerSyncSteps(
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      {
        fetchAll: () => fetchProdutoGrupoMap(prisma),
      },
    ),
  );

  return { store, pipeline };
}
