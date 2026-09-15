import { getPrismaClient } from "../../../config/prisma";
import { OverviewCustomerSyncRepository } from "../repositories/OverviewCustomerSyncRepository";
import { createOverviewCustomerDetailRoutes } from "./routes/overviewCustomerDetailRoutes";
import { GetOverviewCustomerDetailUseCase } from "../useCases/GetOverviewCustomerDetailUseCase";

export function createOverviewCustomerRouter(
  prisma = getPrismaClient(),
) {
  const store = new OverviewCustomerSyncRepository(prisma);
  return createOverviewCustomerDetailRoutes({
    getDetail: new GetOverviewCustomerDetailUseCase(store),
  });
}
