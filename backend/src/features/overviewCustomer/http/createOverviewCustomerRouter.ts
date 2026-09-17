import { getPrismaClient } from "../../../config/prisma";
import { OverviewCustomerSyncRepository } from "../repositories/OverviewCustomerSyncRepository";
import { createOverviewCustomerDetailRoutes } from "./routes/overviewCustomerDetailRoutes";
import { GetOverviewCustomerDetailUseCase } from "../useCases/GetOverviewCustomerDetailUseCase";
import { ListOverviewCustomersUseCase } from "../useCases/ListOverviewCustomersUseCase";
import { GetOverviewCustomerMonthlyEvolutionUseCase } from "../useCases/GetOverviewCustomerMonthlyEvolutionUseCase";
import { GetOverviewCustomerRecentCommercialMotionUseCase } from "../useCases/GetOverviewCustomerRecentCommercialMotionUseCase";
import { GetOverviewCustomerPurchasedProductsUseCase } from "../useCases/GetOverviewCustomerPurchasedProductsUseCase";

export function createOverviewCustomerRouter(
  prisma = getPrismaClient(),
) {
  const store = new OverviewCustomerSyncRepository(prisma);
  return createOverviewCustomerDetailRoutes({
    getDetail: new GetOverviewCustomerDetailUseCase(store),
    listCustomers: new ListOverviewCustomersUseCase(store),
    getMonthlyEvolution: new GetOverviewCustomerMonthlyEvolutionUseCase(store),
    getRecentCommercialMotion: new GetOverviewCustomerRecentCommercialMotionUseCase(
      store,
    ),
    getPurchasedProducts: new GetOverviewCustomerPurchasedProductsUseCase(store),
  });
}
