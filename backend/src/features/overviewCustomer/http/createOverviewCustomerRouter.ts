import { getPrismaClient } from "../../../config/prisma";
import { OverviewCustomerSyncRepository } from "../repositories/OverviewCustomerSyncRepository";
import { createOverviewCustomerDetailRoutes } from "./routes/overviewCustomerDetailRoutes";
import { GetOverviewCustomerDetailUseCase } from "../useCases/GetOverviewCustomerDetailUseCase";
import { ListOverviewCustomersUseCase } from "../useCases/ListOverviewCustomersUseCase";
import { GetOverviewCustomerMonthlyEvolutionUseCase } from "../useCases/GetOverviewCustomerMonthlyEvolutionUseCase";
import { GetOverviewCustomerRecentCommercialMotionUseCase } from "../useCases/GetOverviewCustomerRecentCommercialMotionUseCase";
import { GetOverviewCustomerPurchasedProductsUseCase } from "../useCases/GetOverviewCustomerPurchasedProductsUseCase";
import { GetOverviewCustomerAbcGroupsUseCase } from "../useCases/GetOverviewCustomerAbcGroupsUseCase";
import { GetOverviewCustomerGroupAnaliseUseCase } from "../useCases/GetOverviewCustomerGroupAnaliseUseCase";
import { GetOverviewCustomerGroupGanhosUseCase } from "../useCases/GetOverviewCustomerGroupGanhosUseCase";
import { OverviewCustomerOrderLossRepository } from "../repositories/OverviewCustomerOrderLossRepository";
import { OverviewCustomerGroupPerdidosSeniorQuery } from "../sync/OverviewCustomerGroupPerdidosSeniorQuery";

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
    getAbcGroups: new GetOverviewCustomerAbcGroupsUseCase(store),
    getGroupGanhos: new GetOverviewCustomerGroupGanhosUseCase(store),
    getGroupAnalise: new GetOverviewCustomerGroupAnaliseUseCase(
      store,
      new OverviewCustomerGroupPerdidosSeniorQuery(),
      new OverviewCustomerOrderLossRepository(prisma),
    ),
  });
}
