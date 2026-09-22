import {
  addCalendarDays,
  formatSaoPauloCalendarDate,
} from "../../../utils/saoPauloCalendarDate";

export type OverviewCustomerGroupQuoteWindow = {
  dataInicio: string;
  dataFimExclusiva: string;
};

export function buildOverviewCustomerGroupQuoteWindow(
  now: Date = new Date(),
): OverviewCustomerGroupQuoteWindow {
  const today = formatSaoPauloCalendarDate(now);
  return {
    dataInicio: addCalendarDays(today, -12),
    dataFimExclusiva: addCalendarDays(today, 1),
  };
}
