type OverviewCustomerSyncSchedulerConfig = {
  cronExpression: string;
  enabled: boolean;
  timezone: string;
};

function parseEnabled(value: string | undefined): boolean {
  if (!value) {
    return true;
  }
  return value.toLowerCase() !== "false";
}

export const overviewCustomerSyncConfig: OverviewCustomerSyncSchedulerConfig = {
  cronExpression: process.env.OVERVIEW_SYNC_CRON ?? "0 3 * * *",
  enabled: parseEnabled(process.env.OVERVIEW_SYNC_SCHEDULER_ENABLED),
  timezone: process.env.OVERVIEW_SYNC_TIMEZONE ?? "America/Sao_Paulo",
};
