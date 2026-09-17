import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import React, { type ReactNode } from "react";
import {
  OVERVIEW_CUSTOMER_DETAIL_TABS,
  type OverviewCustomerDetailTabId,
} from "./overviewCustomerDetailTabs.constants";

type OverviewCustomerDetailTabsProps = {
  activeTab: OverviewCustomerDetailTabId;
  onTabChange: (tab: OverviewCustomerDetailTabId) => void;
  productCount: number | null;
  overviewPanel: ReactNode;
  historyPanel: ReactNode;
  productsPanel: ReactNode;
  motionPanel: ReactNode;
};

const TAB_ORDER: OverviewCustomerDetailTabId[] = [
  OVERVIEW_CUSTOMER_DETAIL_TABS.overview.id,
  OVERVIEW_CUSTOMER_DETAIL_TABS.history.id,
  OVERVIEW_CUSTOMER_DETAIL_TABS.products.id,
  OVERVIEW_CUSTOMER_DETAIL_TABS.motion.id,
];

function resolvePanel(
  activeTab: OverviewCustomerDetailTabId,
  panels: {
    overviewPanel: ReactNode;
    historyPanel: ReactNode;
    productsPanel: ReactNode;
    motionPanel: ReactNode;
  },
): ReactNode {
  if (activeTab === OVERVIEW_CUSTOMER_DETAIL_TABS.history.id) {
    return panels.historyPanel;
  }
  if (activeTab === OVERVIEW_CUSTOMER_DETAIL_TABS.products.id) {
    return panels.productsPanel;
  }
  if (activeTab === OVERVIEW_CUSTOMER_DETAIL_TABS.motion.id) {
    return panels.motionPanel;
  }
  return panels.overviewPanel;
}

export function OverviewCustomerDetailTabs({
  activeTab,
  onTabChange,
  productCount,
  overviewPanel,
  historyPanel,
  productsPanel,
  motionPanel,
}: OverviewCustomerDetailTabsProps) {
  return (
    <section className="space-y-4">
      <div
        role="tablist"
        aria-label="Seções da análise comercial"
        className="flex gap-1 overflow-x-auto border-b border-border pb-0"
      >
        {TAB_ORDER.map((tabId) => {
          const tab = OVERVIEW_CUSTOMER_DETAIL_TABS[tabId];
          const isActive = activeTab === tabId;

          return (
            <button
              key={tabId}
              type="button"
              role="tab"
              id={`overview-customer-tab-${tabId}`}
              aria-selected={isActive}
              aria-controls={`overview-customer-panel-${tabId}`}
              className={cn(
                "inline-flex shrink-0 items-center gap-2 border-b-2 px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
              onClick={() => onTabChange(tabId)}
            >
              {tab.label}
              {tabId === OVERVIEW_CUSTOMER_DETAIL_TABS.products.id && productCount != null ? (
                <Badge variant="secondary" className="text-xs">
                  {productCount} itens
                </Badge>
              ) : null}
            </button>
          );
        })}
      </div>
      <div
        role="tabpanel"
        id={`overview-customer-panel-${activeTab}`}
        aria-labelledby={`overview-customer-tab-${activeTab}`}
        className="space-y-4"
      >
        {resolvePanel(activeTab, {
          overviewPanel,
          historyPanel,
          productsPanel,
          motionPanel,
        })}
      </div>
    </section>
  );
}
