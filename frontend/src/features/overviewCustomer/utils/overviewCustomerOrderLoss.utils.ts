const ORDER_LOSS_CUSTOMER_CODE_PARAM = "customerCode";

export function buildOverviewCustomerDetailHref(customerCode: number): string {
  return `/overview/customers/${customerCode}`;
}

export function buildOverviewCustomerOrderLossHref(customerCode: number): string {
  const params = new URLSearchParams();
  params.set(ORDER_LOSS_CUSTOMER_CODE_PARAM, String(customerCode));
  return `/order-loss?${params.toString()}`;
}

export function parseOrderLossCustomerCodeParam(
  raw: string | null,
): number | null {
  if (!raw) {
    return null;
  }
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

export { ORDER_LOSS_CUSTOMER_CODE_PARAM };
