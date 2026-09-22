type GrpproSyncSchedulerConfig = {
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

export const grpproSyncConfig: GrpproSyncSchedulerConfig = {
  cronExpression: process.env.GRPPRO_SYNC_CRON ?? "0 3 * * *",
  enabled: parseEnabled(process.env.GRPPRO_SYNC_SCHEDULER_ENABLED),
  timezone: process.env.GRPPRO_SYNC_TIMEZONE ?? "America/Sao_Paulo",
};
