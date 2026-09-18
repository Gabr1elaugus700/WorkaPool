import { sqlPool, sqlPoolConnect } from "../../../database/sqlServer";
import type { GrpproSeniorReader } from "../sync/ports";
import type { GrpproRow } from "../sync/types";

type GrpproSeniorRecord = {
  CODGRP: string;
  DESGRP: string;
  CODPRO: string;
};

export class GrpproSeniorRepository implements GrpproSeniorReader {
  async fetchAll(): Promise<GrpproRow[]> {
    await sqlPoolConnect;

    const result = await sqlPool.request().query<GrpproSeniorRecord>(`
      SELECT CODGRP, DESGRP, CODPRO
      FROM poolbi.dbo.grppro
      ORDER BY CODGRP, CODPRO
    `);

    return result.recordset.map((row) => ({
      grupoCodigo: row.CODGRP.trim(),
      grupoDescricao: row.DESGRP.trim(),
      produtoCodigo: row.CODPRO.trim(),
    }));
  }
}
