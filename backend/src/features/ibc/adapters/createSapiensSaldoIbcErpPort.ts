import sql from "mssql";
import { sqlPool, sqlPoolConnect } from "../../../database/sqlServer";
import {
  SALDO_IBC_ERP_QUERY,
  SaldoIbcErpQueryRow,
  SapiensSaldoIbcErpAdapter,
} from "./SapiensSaldoIbcErpAdapter";

/**
 * Factory do port SaldoIbcErp com executor MSSQL (e210est / codpro 251001).
 */
export function createSapiensSaldoIbcErpPort(
  codemp = 1,
): SapiensSaldoIbcErpAdapter {
  return new SapiensSaldoIbcErpAdapter({
    codemp,
    executeQuery: async ({ codpro, codemp: emp }) => {
      await sqlPoolConnect;
      const result = await sqlPool
        .request()
        .input("codpro", sql.VarChar, codpro)
        .input("codemp", sql.Int, emp)
        .query<SaldoIbcErpQueryRow>(SALDO_IBC_ERP_QUERY);
      return result.recordset;
    },
  });
}
