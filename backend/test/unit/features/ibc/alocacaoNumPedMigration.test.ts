import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const migrationPath =
  "prisma/migrations/20261019120000_alocacao_ibc_num_ped_nullable/migration.sql";

describe("migration AlocacaoIbc.numPed", () => {
  it("permite pedido nulo sem apagar o pedido já gravado", () => {
    const sql = readFileSync(migrationPath, "utf8");
    assert.match(sql, /ALTER TABLE "AlocacaoIbc" ALTER COLUMN "numPed" DROP NOT NULL/);
    assert.doesNotMatch(sql, /\bUPDATE\b/i);
    assert.doesNotMatch(sql, /SET\s+"numPed"\s*=\s*NULL/i);
  });
});
