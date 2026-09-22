import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  materializeOverviewCustomerWinsByGroup,
  type OverviewCustomerWinsByGroupLine,
  type OverviewCustomerWinsByGroupSeed,
} from "../../../../../src/features/overviewCustomer/sync/materializeOverviewCustomerWinsByGroup";

function line(
  overrides: Partial<OverviewCustomerWinsByGroupLine> &
    Pick<OverviewCustomerWinsByGroupLine, "productCode" | "orderId" | "invoiceNumber">,
): OverviewCustomerWinsByGroupLine {
  return {
    customerCode: 123,
    issuedAt: "2024-06-01",
    quantityInvoiced: 2,
    quantityReturned: 0,
    unitPrice: 10,
    lineMarginPercent: 20,
    ...overrides,
  };
}

describe("materializeOverviewCustomerWinsByGroup", () => {
  it("aggregates lines of the same order inside one group and ignores pre-2024 invoices", () => {
    const seed: OverviewCustomerWinsByGroupSeed = {
      lines: [
        line({
          productCode: "100",
          orderId: 9001,
          invoiceNumber: 111,
          issuedAt: "2023-12-25",
          quantityInvoiced: 9,
          unitPrice: 99,
        }),
        line({
          productCode: "100",
          orderId: 9001,
          invoiceNumber: 111,
          quantityInvoiced: 2,
          unitPrice: 10,
          lineMarginPercent: 20,
        }),
        line({
          productCode: "101",
          orderId: 9001,
          invoiceNumber: 111,
          quantityInvoiced: 3,
          unitPrice: 10,
          lineMarginPercent: 40,
        }),
      ],
      grupoMap: [
        { produtoCodigo: "100", grupoCodigo: "G01", grupoDescricao: "TUBOS" },
        { produtoCodigo: "101", grupoCodigo: "G01", grupoDescricao: "TUBOS" },
      ],
    };

    const snapshot = materializeOverviewCustomerWinsByGroup(seed);
    const rows = snapshot.customers["123"];
    assert.ok(rows);
    assert.strictEqual(rows.length, 1);
    assert.deepStrictEqual(rows[0], {
      grupoCodigo: "G01",
      grupoDescricao: "TUBOS",
      numped: 9001,
      numnfv: 111,
      datemi: "2024-06-01",
      qtdped: 5,
      volume: 5,
      vlrfinal: 50,
      preuni: 10,
      margem: 32,
    });
  });

  it("buckets unmapped SKUs as OUTROS PRODUTOS", () => {
    const seed: OverviewCustomerWinsByGroupSeed = {
      lines: [
        line({
          productCode: "999",
          orderId: 8001,
          invoiceNumber: 50,
          quantityInvoiced: 1,
          unitPrice: 100,
          lineMarginPercent: 10,
        }),
      ],
      grupoMap: [],
    };

    const rows = materializeOverviewCustomerWinsByGroup(seed).customers["123"];
    assert.ok(rows);
    assert.strictEqual(rows.length, 1);
    assert.strictEqual(rows[0].grupoCodigo, "OUTROS");
    assert.strictEqual(rows[0].grupoDescricao, "OUTROS PRODUTOS");
    assert.strictEqual(rows[0].numped, 8001);
    assert.strictEqual(rows[0].vlrfinal, 100);
  });

  it("keeps the same numped in each group with only that group's totals", () => {
    const seed: OverviewCustomerWinsByGroupSeed = {
      lines: [
        line({
          productCode: "100",
          orderId: 9001,
          invoiceNumber: 111,
          quantityInvoiced: 2,
          unitPrice: 10,
          lineMarginPercent: 10,
        }),
        line({
          productCode: "200",
          orderId: 9001,
          invoiceNumber: 111,
          quantityInvoiced: 3,
          unitPrice: 10,
          lineMarginPercent: 10,
        }),
      ],
      grupoMap: [
        { produtoCodigo: "100", grupoCodigo: "G01", grupoDescricao: "TUBOS" },
        { produtoCodigo: "200", grupoCodigo: "G02", grupoDescricao: "CONEXOES" },
      ],
    };

    const rows = materializeOverviewCustomerWinsByGroup(seed).customers["123"];
    assert.ok(rows);
    assert.strictEqual(rows.length, 2);
    const tubos = rows.find((row) => row.grupoCodigo === "G01");
    const conexoes = rows.find((row) => row.grupoCodigo === "G02");
    assert.ok(tubos);
    assert.ok(conexoes);
    assert.strictEqual(tubos.numped, 9001);
    assert.strictEqual(conexoes.numped, 9001);
    assert.strictEqual(tubos.qtdped, 2);
    assert.strictEqual(tubos.vlrfinal, 20);
    assert.strictEqual(conexoes.qtdped, 3);
    assert.strictEqual(conexoes.vlrfinal, 30);
  });

  it("uses the most recent invoice number when one order+group has several NFs", () => {
    const seed: OverviewCustomerWinsByGroupSeed = {
      lines: [
        line({
          productCode: "100",
          orderId: 9001,
          invoiceNumber: 10,
          issuedAt: "2024-01-10",
          quantityInvoiced: 1,
          unitPrice: 10,
          lineMarginPercent: 10,
        }),
        line({
          productCode: "100",
          orderId: 9001,
          invoiceNumber: 20,
          issuedAt: "2024-02-10",
          quantityInvoiced: 1,
          unitPrice: 10,
          lineMarginPercent: 10,
        }),
      ],
      grupoMap: [{ produtoCodigo: "100", grupoCodigo: "G01", grupoDescricao: "TUBOS" }],
    };

    const rows = materializeOverviewCustomerWinsByGroup(seed).customers["123"];
    assert.ok(rows);
    assert.strictEqual(rows.length, 1);
    assert.strictEqual(rows[0].numnfv, 20);
    assert.strictEqual(rows[0].datemi, "2024-02-10");
    assert.strictEqual(rows[0].qtdped, 2);
    assert.strictEqual(rows[0].vlrfinal, 20);
  });

  it("halves volume for product 101072 and volume-weights preuni", () => {
    const seed: OverviewCustomerWinsByGroupSeed = {
      lines: [
        line({
          productCode: "101072",
          orderId: 501,
          invoiceNumber: 70,
          quantityInvoiced: 10,
          quantityReturned: 2,
          unitPrice: 20,
          lineMarginPercent: 30,
        }),
        line({
          productCode: "200200",
          orderId: 501,
          invoiceNumber: 70,
          quantityInvoiced: 5,
          unitPrice: 10,
          lineMarginPercent: 10,
        }),
      ],
      grupoMap: [
        { produtoCodigo: "101072", grupoCodigo: "G01", grupoDescricao: "TUBOS" },
        { produtoCodigo: "200200", grupoCodigo: "G01", grupoDescricao: "TUBOS" },
      ],
    };

    const rows = materializeOverviewCustomerWinsByGroup(seed).customers["123"];
    assert.ok(rows);
    assert.strictEqual(rows.length, 1);
    assert.strictEqual(rows[0].qtdped, 13);
    assert.strictEqual(rows[0].volume, 9);
    assert.strictEqual(rows[0].vlrfinal, 210);
    assert.strictEqual(rows[0].preuni, 14.44);
    assert.strictEqual(rows[0].margem, 25.24);
  });
});
