import { getPrismaClient } from "../../../config/prisma";
import { OverviewCustomerSyncRepository } from "../repositories/OverviewCustomerSyncRepository";
import { OverviewCustomerSyncPipeline } from "./OverviewCustomerSyncPipeline";
import { createOverviewCustomerSyncSteps } from "./createOverviewCustomerSyncSteps";

export function createOverviewCustomerSyncRuntime(
  prisma = getPrismaClient(),
): {
  store: OverviewCustomerSyncRepository;
  pipeline: OverviewCustomerSyncPipeline;
} {
  const store = new OverviewCustomerSyncRepository(prisma);
  const pipeline = new OverviewCustomerSyncPipeline(
    store,
    createOverviewCustomerSyncSteps(),
  );

  return { store, pipeline };
}
