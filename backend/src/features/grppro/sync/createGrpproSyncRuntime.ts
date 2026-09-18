import { getPrismaClient } from "../../../config/prisma";
import { GrpproSeniorRepository } from "../repositories/GrpproSeniorRepository";
import { GrpproSyncRepository } from "../repositories/GrpproSyncRepository";
import { ProdutoGrupoMapRepository } from "../repositories/ProdutoGrupoMapRepository";
import { GrpProSyncPipeline } from "./GrpProSyncPipeline";

export function createGrpproSyncRuntime(
  prisma = getPrismaClient(),
): {
  store: GrpproSyncRepository;
  pipeline: GrpProSyncPipeline;
} {
  const store = new GrpproSyncRepository(prisma);
  const seniorReader = new GrpproSeniorRepository();
  const mapWriter = new ProdutoGrupoMapRepository(prisma);
  const pipeline = new GrpProSyncPipeline(store, seniorReader, mapWriter);

  return { store, pipeline };
}
