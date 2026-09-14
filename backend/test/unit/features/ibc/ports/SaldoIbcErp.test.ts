import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { FakeSaldoIbcErp } from "../../../../../src/features/ibc/adapters/FakeSaldoIbcErp";
import {
  CODPRO_IBC_CONTAINER,
  SALDO_IBC_ERP_QUERY,
  SapiensSaldoIbcErpAdapter,
} from "../../../../../src/features/ibc/adapters/SapiensSaldoIbcErpAdapter";
import { GetSaldoIbcErpUseCase } from "../../../../../src/features/ibc/useCases/GetSaldoIbcErp.use-case";

describe("SaldoIbcErp port (#118 / #120)", () => {
  it("returns numeric saldo for codpro 251001", async () => {
    const port = new FakeSaldoIbcErp({ status: "available", quantity: 150 });
    const useCase = new GetSaldoIbcErpUseCase(port);

    const result = await useCase.execute();

    assert.deepEqual(result, { status: "available", quantity: 150 });
  });

  it("treats zero saldo as a valid available result", async () => {
    const port = new FakeSaldoIbcErp({ status: "available", quantity: 0 });
    const useCase = new GetSaldoIbcErpUseCase(port);

    const result = await useCase.execute();

    assert.deepEqual(result, { status: "available", quantity: 0 });
  });

  it("signals unavailable when ERP query fails without throwing", async () => {
    const adapter = new SapiensSaldoIbcErpAdapter({
      executeQuery: async () => {
        throw new Error("connection refused");
      },
    });
    const useCase = new GetSaldoIbcErpUseCase(adapter);

    const result = await useCase.execute();

    assert.deepEqual(result, { status: "unavailable" });
  });

  it("adapter maps only codpro 251001 stock (not packaging math)", async () => {
    let receivedCodpro: string | undefined;
    const adapter = new SapiensSaldoIbcErpAdapter({
      executeQuery: async ({ codpro }) => {
        receivedCodpro = codpro;
        return [{ SALDO: 42 }];
      },
    });

    const result = await adapter.getSaldo();

    assert.equal(receivedCodpro, CODPRO_IBC_CONTAINER);
    assert.equal(CODPRO_IBC_CONTAINER, "251001");
    assert.match(SALDO_IBC_ERP_QUERY, /e210est/);
    assert.match(SALDO_IBC_ERP_QUERY, /qtdest/);
    assert.doesNotMatch(SALDO_IBC_ERP_QUERY, /usu_codemb|VOLUME_EMBALAGEM|CODIGO_EMBALAGEM/i);
    assert.deepEqual(result, { status: "available", quantity: 42 });
  });

  it("consumer can distinguish available vs unavailable without throwing", async () => {
    const available = await new GetSaldoIbcErpUseCase(
      new FakeSaldoIbcErp({ status: "available", quantity: 10 }),
    ).execute();
    const unavailable = await new GetSaldoIbcErpUseCase(
      new FakeSaldoIbcErp({ status: "unavailable" }),
    ).execute();

    assert.equal(available.status, "available");
    if (available.status === "available") {
      assert.equal(available.quantity, 10);
    }
    assert.equal(unavailable.status, "unavailable");
  });

  it("saldo seam query is read-only (no stock writes)", () => {
    assert.doesNotMatch(SALDO_IBC_ERP_QUERY, /\b(UPDATE|INSERT|DELETE|MERGE)\b/i);
    assert.match(SALDO_IBC_ERP_QUERY, /^\s*SELECT\b/i);
  });
});
