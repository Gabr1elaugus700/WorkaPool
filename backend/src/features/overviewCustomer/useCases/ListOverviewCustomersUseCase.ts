import { Role } from "@prisma/client";
import { AppError } from "../../../utils/AppError";
import type { OverviewCustomerIdentity } from "../models/OverviewCustomerIdentity";
import type { OverviewCustomerSyncStore } from "../sync/ports";
import { extractOverviewCustomerIdentitySnapshot } from "../sync/extractOverviewCustomerIdentitySnapshot";

const OVERVIEW_ALLOWED_ROLES: Role[] = [Role.ADMIN, Role.GERENTE_DPTO, Role.VENDAS];
const PAGE_SIZE = 20;

type SortField = "orderCountLast12Months" | "lastPurchase";

export type ListOverviewCustomersInput = {
  role: Role;
  codRep?: number;
  search?: string;
  page: number;
};

export type OverviewCustomerListRow = {
  customerCode: number;
  tradeName: string;
  city: string;
  state: string;
  primaryCodRep: number | null;
  branchIndicator: OverviewCustomerIdentity["branchIndicator"];
  lastPurchaseAt: string | null;
  orderCountLast12Months?: number;
  revenueLast12Months?: number;
  daysSinceLastPurchase: number | null;
};

export type ListOverviewCustomersResult = {
  items: OverviewCustomerListRow[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
  };
  sort: {
    field: SortField;
    direction: "desc";
  };
};

export class ListOverviewCustomersUseCase {
  constructor(private readonly store: OverviewCustomerSyncStore) {}

  async execute(input: ListOverviewCustomersInput): Promise<ListOverviewCustomersResult> {
    if (!OVERVIEW_ALLOWED_ROLES.includes(input.role)) {
      throw new AppError({
        message: "Acesso negado",
        statusCode: 403,
        code: "OVERVIEW_CUSTOMER_FORBIDDEN",
      });
    }

    const snapshot = await this.store.getServedSnapshot();
    if (!snapshot) {
      return this.emptyResult(input.page, "lastPurchase");
    }

    const parsed = extractOverviewCustomerIdentitySnapshot(snapshot.payload);
    if (!parsed) {
      return this.emptyResult(input.page, "lastPurchase");
    }

    const scopedEntries = Object.entries(parsed.customers).filter(([, customer]) =>
      this.hasAccess(customer, input.role, input.codRep),
    );

    const searchedEntries = this.applySearch(scopedEntries, input.search);
    const rows = searchedEntries.map(([, customer]) => this.mapRow(customer));

    const defaultSortField: SortField = rows.some(
      (row) => typeof row.orderCountLast12Months === "number",
    )
      ? "orderCountLast12Months"
      : "lastPurchase";

    rows.sort((a, b) => this.compareRows(a, b, defaultSortField));

    const totalItems = rows.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
    const safePage = Math.min(Math.max(input.page, 1), totalPages);
    const start = (safePage - 1) * PAGE_SIZE;
    const items = rows.slice(start, start + PAGE_SIZE);

    return {
      items,
      pagination: {
        page: safePage,
        pageSize: PAGE_SIZE,
        totalItems,
        totalPages,
        hasNextPage: safePage < totalPages,
      },
      sort: {
        field: defaultSortField,
        direction: "desc",
      },
    };
  }

  private hasAccess(
    customer: OverviewCustomerIdentity,
    role: Role,
    codRep?: number,
  ): boolean {
    if (role !== Role.VENDAS) {
      return true;
    }
    if (typeof codRep !== "number") {
      return false;
    }
    return customer.primaryCodRep === codRep;
  }

  private applySearch(
    entries: Array<[string, OverviewCustomerIdentity]>,
    search?: string,
  ): Array<[string, OverviewCustomerIdentity]> {
    const normalizedSearch = (search ?? "").trim();
    if (!normalizedSearch) {
      return entries;
    }

    const lowerSearch = normalizedSearch.toLowerCase();
    const searchDigits = normalizedSearch.replace(/\D/g, "");
    const exactCode = Number.parseInt(normalizedSearch, 10);
    const hasExactCode = Number.isInteger(exactCode) && String(exactCode) === normalizedSearch;

    return entries.filter(([, customer]) => {
      if (hasExactCode && customer.customerCode === exactCode) {
        return true;
      }
      if (customer.tradeName.toLowerCase().includes(lowerSearch)) {
        return true;
      }
      if (!searchDigits) {
        return false;
      }
      const customerDocumentDigits = customer.document.replace(/\D/g, "");
      return customerDocumentDigits.includes(searchDigits);
    });
  }

  private mapRow(customer: OverviewCustomerIdentity): OverviewCustomerListRow {
    return {
      customerCode: customer.customerCode,
      tradeName: customer.tradeName,
      city: customer.city,
      state: customer.state,
      primaryCodRep: customer.primaryCodRep,
      branchIndicator: customer.branchIndicator,
      lastPurchaseAt: customer.lastInvoicedPurchaseAt ?? null,
      orderCountLast12Months: customer.orderCountLast12Months,
      revenueLast12Months: customer.revenueLast12Months,
      daysSinceLastPurchase: customer.daysSinceLastPurchase ?? null,
    };
  }

  private compareRows(
    a: OverviewCustomerListRow,
    b: OverviewCustomerListRow,
    sortField: SortField,
  ): number {
    if (sortField === "orderCountLast12Months") {
      const aValue = a.orderCountLast12Months ?? Number.NEGATIVE_INFINITY;
      const bValue = b.orderCountLast12Months ?? Number.NEGATIVE_INFINITY;
      if (aValue !== bValue) {
        return bValue - aValue;
      }
    }

    const aTimestamp = this.toTimestamp(a.lastPurchaseAt);
    const bTimestamp = this.toTimestamp(b.lastPurchaseAt);
    if (aTimestamp !== bTimestamp) {
      return bTimestamp - aTimestamp;
    }
    return b.customerCode - a.customerCode;
  }

  private toTimestamp(value: string | null): number {
    if (!value) {
      return Number.NEGATIVE_INFINITY;
    }
    const timestamp = Date.parse(value);
    return Number.isNaN(timestamp) ? Number.NEGATIVE_INFINITY : timestamp;
  }

  private emptyResult(page: number, sortField: SortField): ListOverviewCustomersResult {
    return {
      items: [],
      pagination: {
        page: Math.max(1, page),
        pageSize: PAGE_SIZE,
        totalItems: 0,
        totalPages: 1,
        hasNextPage: false,
      },
      sort: {
        field: sortField,
        direction: "desc",
      },
    };
  }
}
