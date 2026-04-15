// PRIMEIRO: Configurar variáveis de ambiente
import { app } from "./app";
import "./config/env";
import { WatchdogScheduler } from "./schedulers/watchdog/WatchdogScheduler";

console.log("🧪 DATABASE_URL carregado:", process.env.DATABASE_URL);

// Iniciar Watchdog Scheduler
const watchdog = new WatchdogScheduler();
watchdog.start();

// Iniciar servidor
const PORT = Number(process.env.PORT) || 3005; // Porta padrão para produção: 3001

app.listen(PORT, "0.0.0.0", () => {
  console.log(
    `🚀 Backend rodando em modo ${process.env.NODE_ENV || "development"}`
  );
  console.log(`📡 Servidor: http://192.168.0.32:${PORT}`);
  console.log(`📚 Swagger: http://192.168.0.32:${PORT}/api-docs`);
  console.log(`❤️  Health Check: http://192.168.0.32:${PORT}/health`);
});
