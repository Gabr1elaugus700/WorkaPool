export type IbcPageTab = {
  id: string;
  to: string;
  label: string;
  allowedRoles?: readonly string[];
};

export function filterIbcPageTabs(
  tabs: readonly IbcPageTab[],
  role: string | undefined,
): IbcPageTab[] {
  return tabs.filter(
    (tab) => !tab.allowedRoles || (role !== undefined && tab.allowedRoles.includes(role)),
  );
}
