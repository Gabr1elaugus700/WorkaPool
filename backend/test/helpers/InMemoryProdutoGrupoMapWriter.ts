import type { ProdutoGrupoMapWriter } from "../../src/features/grppro/sync/ports";
import type { GrpproRow } from "../../src/features/grppro/sync/types";

export class InMemoryProdutoGrupoMapWriter implements ProdutoGrupoMapWriter {
  stagingRows: GrpproRow[] = [];
  productionRows: GrpproRow[] = [];
  swapCount = 0;
  shouldFailOnSwap = false;

  async truncateStaging(): Promise<void> {
    this.stagingRows = [];
  }

  async bulkInsertStaging(rows: GrpproRow[], _syncedAt: Date): Promise<void> {
    this.stagingRows = [...rows];
  }

  async atomicSwap(): Promise<void> {
    if (this.shouldFailOnSwap) {
      throw new Error("swap failed");
    }
    this.productionRows = [...this.stagingRows];
    this.stagingRows = [];
    this.swapCount += 1;
  }

  async countProduction(): Promise<number> {
    return this.productionRows.length;
  }
}
