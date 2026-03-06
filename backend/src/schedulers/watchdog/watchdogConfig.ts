// Configuracoes do Watchdog Scheduler
// 
// Sintaxe Cron: minuto hora dia mes dia-da-semana
// Exemplo: "*/2 * * * *" = A cada 2 minutos

export const watchdogConfig = {
  cronExpression: "*/2 * * * *",
  enabled: true,
  timezone: "America/Sao_Paulo",
};
