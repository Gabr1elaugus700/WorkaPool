import { PrismaClient } from "@prisma/client";
import type { ProdutoGrupoMapWriter } from "../sync/ports";
import type { GrpproRow } from "../sync/types";

const BULK_INSERT_CHUNK_SIZE = 1000;

export class ProdutoGrupoMapRepository implements ProdutoGrupoMapWriter {
  constructor(private readonly prisma: PrismaClient) {}

  async truncateStaging(): Promise<void> {
    await this.prisma.$executeRawUnsafe(
      `TRUNCATE TABLE "produto_grupo_map_staging"`,
    );
  }

  async bulkInsertStaging(rows: GrpproRow[], syncedAt: Date): Promise<void> {
    for (let offset = 0; offset < rows.length; offset += BULK_INSERT_CHUNK_SIZE) {
      const chunk = rows.slice(offset, offset + BULK_INSERT_CHUNK_SIZE);
      await this.prisma.produtoGrupoMapStaging.createMany({
        data: chunk.map((row) => ({
          grupoCodigo: row.grupoCodigo,
          grupoDescricao: row.grupoDescricao,
          produtoCodigo: row.produtoCodigo,
          syncedAt,
        })),
      });
    }
  }

  async atomicSwap(): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.$executeRawUnsafe(
        `ALTER TABLE "produto_grupo_map" RENAME TO "produto_grupo_map_old"`,
      ),
      this.prisma.$executeRawUnsafe(
        `ALTER TABLE "produto_grupo_map_staging" RENAME TO "produto_grupo_map"`,
      ),
      this.prisma.$executeRawUnsafe(
        `ALTER TABLE "produto_grupo_map_old" RENAME TO "produto_grupo_map_staging"`,
      ),
      this.prisma.$executeRawUnsafe(
        `TRUNCATE TABLE "produto_grupo_map_staging"`,
      ),
    ]);
  }

  async countProduction(): Promise<number> {
    return this.prisma.produtoGrupoMap.count();
  }
}
