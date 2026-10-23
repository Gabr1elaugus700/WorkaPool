import prisma from "../../../config/prisma";
import { SapiensItensPedidoReader } from "../adapters/SapiensItensPedidoReader";
import { CargaPedidoIbcGruposBackfillRepository } from "../repositories/CargaPedidoIbcGruposBackfillRepository";
import { backfillCargaPedidoIbcGrupos } from "../services/backfillCargaPedidoIbcGrupos";

async function run(): Promise<void> {
  const store = new CargaPedidoIbcGruposBackfillRepository(prisma);
  const itens = new SapiensItensPedidoReader();
  const result = await backfillCargaPedidoIbcGrupos({
    listFotos: () => store.listFotos(),
    saveGrupos: (id, gruposCodigo) => store.saveGrupos(id, gruposCodigo),
    listItensByNumPed: (numPeds) => itens.listItensByNumPed(numPeds),
    listGruposByProduto: (codigos) => store.listGruposByProduto(codigos),
  });
  console.log(`Backfill gruposCodigo: ${result.atualizadas} foto(s) atualizada(s).`);
}

run()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
