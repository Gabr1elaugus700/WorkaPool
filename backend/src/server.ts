// PRIMEIRO: Configurar variáveis de ambiente
import { app } from "./app";
import "./config/env";
import { WatchdogScheduler } from "./schedulers/watchdog/WatchdogScheduler";

console.log("🧪 DATABASE_URL carregado:", process.env.DATABASE_URL);

// Iniciar Watchdog Scheduler
const watchdog = new WatchdogScheduler();
watchdog.start();

// Iniciar servidor
const PORT = Number(process.env.PORT) || 3005; 

app.listen(PORT, "0.0.0.0", () => {
  console.log(
    `🚀 Backend rodando em modo ${process.env.NODE_ENV || "development"}`
  );
  console.log(`📡 Servidor: ${process.env.API_SERVER_URL + ":" + process.env.PORT}`);
  console.log(`📚 Swagger: ${process.env.API_SERVER_URL + ":" + process.env.PORT + "/api-docs"}`);
  console.log(`❤️  Health Check: ${process.env.API_SERVER_URL + ":" + process.env.PORT + "/health"}`);
});
