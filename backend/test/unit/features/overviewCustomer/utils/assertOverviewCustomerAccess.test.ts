import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { Role } from "@prisma/client";
import { AppError } from "../../../../../src/utils/AppError";
import { assertOverviewCustomerAccess } from "../../../../../src/features/overviewCustomer/utils/assertOverviewCustomerAccess";
import { InMemoryOverviewCustomerSyncStore } from "../../../../helpers/InMemoryOverviewCustomerSyncStore";

function identityCustomer(primaryCodRep: number | null = 10) {
  return {
    customerCode: 123,
    tradeName: "Cliente A",
    document: "00.000.000/0001-00",
    city: "Maringa",
    state: "PR",
    segment: "Construcao",
    registrationDate: "2024-01-15",
    primaryCodRep,
    firstInvoicedPurchaseAt: "2024-02-01",
    lastInvoicedPurchaseAt: "2026-08-01",
    lastLostOrderAt: "2026-08-05",
    lastCommercialMovementAt: "2026-08-05",
    branchIndicator: "MGA" as const,
  };
}

function seedStore(
  store: InMemoryOverviewCustomerSyncStore,
  primaryCodRep: number | null = 10,
): void {
  store.seedSuccessfulSnapshot(
    {
      id: "snap-1",
      publishedAt: new Date("2026-01-10T00:00:00.000Z"),
      payload: {
        customers: { "123": identityCustomer(primaryCodRep) },
      },
    },
    new Date("2026-01-10T00:00:00.000Z"),
  );
}

async function expectAppError(
  promise: Promise<unknown>,
  expected: { statusCode: number; code: string },
): Promise<void> {
  await assert.rejects(promise, (error: unknown) => {
    assert.ok(error instanceof AppError);
    assert.equal(error.statusCode, expected.statusCode);
    assert.equal(error.code, expected.code);
    return true;
  });
}

describe("assertOverviewCustomerAccess", () => {
  it("allows ADMIN and returns customer with snapshot", async () => {
    const store = new InMemoryOverviewCustomerSyncStore();
    seedStore(store);

    const result = await assertOverviewCustomerAccess(store, {
      customerCode: 123,
      role: Role.ADMIN,
    });

    assert.equal(result.customer.customerCode, 123);
    assert.equal(result.snapshot.id, "snap-1");
  });

  it("allows GERENTE_DPTO", async () => {
    const store = new InMemoryOverviewCustomerSyncStore();
    seedStore(store);

    const result = await assertOverviewCustomerAccess(store, {
      customerCode: 123,
      role: Role.GERENTE_DPTO,
    });

    assert.equal(result.customer.customerCode, 123);
  });

  it("allows VENDAS when codRep matches primaryCodRep", async () => {
    const store = new InMemoryOverviewCustomerSyncStore();
    seedStore(store, 10);

    const result = await assertOverviewCustomerAccess(store, {
      customerCode: 123,
      role: Role.VENDAS,
      codRep: 10,
    });

    assert.equal(result.customer.primaryCodRep, 10);
  });

  it("forbids VENDAS when codRep does not match primaryCodRep", async () => {
    const store = new InMemoryOverviewCustomerSyncStore();
    seedStore(store, 10);

    await expectAppError(
      assertOverviewCustomerAccess(store, {
        customerCode: 123,
        role: Role.VENDAS,
        codRep: 99,
      }),
      { statusCode: 403, code: "OVERVIEW_CUSTOMER_FORBIDDEN" },
    );
  });

  it("forbids VENDAS when primaryCodRep is null", async () => {
    const store = new InMemoryOverviewCustomerSyncStore();
    seedStore(store, null);

    await expectAppError(
      assertOverviewCustomerAccess(store, {
        customerCode: 123,
        role: Role.VENDAS,
        codRep: 10,
      }),
      { statusCode: 403, code: "OVERVIEW_CUSTOMER_FORBIDDEN" },
    );
  });

  it("forbids roles outside ADMIN, GERENTE_DPTO and VENDAS", async () => {
    const store = new InMemoryOverviewCustomerSyncStore();
    seedStore(store);

    await expectAppError(
      assertOverviewCustomerAccess(store, {
        customerCode: 123,
        role: Role.USER,
      }),
      { statusCode: 403, code: "OVERVIEW_CUSTOMER_FORBIDDEN" },
    );
  });

  it("returns NOT_FOUND when no served snapshot exists", async () => {
    const store = new InMemoryOverviewCustomerSyncStore();

    await expectAppError(
      assertOverviewCustomerAccess(store, {
        customerCode: 123,
        role: Role.ADMIN,
      }),
      { statusCode: 404, code: "OVERVIEW_CUSTOMER_NOT_FOUND" },
    );
  });

  it("returns NOT_FOUND when customer is absent from identity snapshot", async () => {
    const store = new InMemoryOverviewCustomerSyncStore();
    seedStore(store);

    await expectAppError(
      assertOverviewCustomerAccess(store, {
        customerCode: 999,
        role: Role.ADMIN,
      }),
      { statusCode: 404, code: "OVERVIEW_CUSTOMER_NOT_FOUND" },
    );
  });
});
