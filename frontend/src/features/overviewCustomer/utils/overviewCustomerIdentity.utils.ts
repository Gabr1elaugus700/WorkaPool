import type { BranchIndicator } from "../types/overviewCustomerDetail.types";

export function formatOverviewBranchIndicator(branchIndicator: BranchIndicator): string {
  if (branchIndicator === "BOTH") {
    return "MGA + CTB";
  }
  return branchIndicator;
}

export function deriveOverviewCustomerInitials(tradeName: string): string {
  const words = tradeName.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return "?";
  }
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }
  return `${words[0][0] ?? ""}${words[1][0] ?? ""}`.toUpperCase();
}
