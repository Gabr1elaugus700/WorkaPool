import { sqlPool, sqlPoolConnect } from "../src/database/sqlServer";

async function main(): Promise<void> {
  await sqlPoolConnect;
  const result = await sqlPool.request().query(`
    SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH
    FROM poolbi.INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = 'grppro'
    ORDER BY ORDINAL_POSITION
  `);
  console.log(JSON.stringify(result.recordset, null, 2));
  await sqlPool.close();
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
});
