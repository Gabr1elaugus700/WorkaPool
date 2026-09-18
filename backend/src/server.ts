// PRIMEIRO: Configurar variáveis de ambiente
import { app } from "./app";
import "./config/env";
import { createOverviewCustomerSyncRuntime } from "./features/overviewCustomer/sync/createOverviewCustomerSyncRuntime";
import { createGrpproSyncRuntime } from "./features/grppro/sync/createGrpproSyncRuntime";
import { OverviewCustomerSyncScheduler } from "./schedulers/overviewCustomerSync/OverviewCustomerSyncScheduler";
import { GrpproSyncScheduler } from "./schedulers/grpproSync/GrpproSyncScheduler";

console.log("🧪 DATABASE_URL carregado:", process.env.DATABASE_URL);

const overviewSyncRuntime = createOverviewCustomerSyncRuntime();
const overviewSyncScheduler = new OverviewCustomerSyncScheduler({
  pipeline: overviewSyncRuntime.pipeline,
});
overviewSyncScheduler.start();

const grpproSyncRuntime = createGrpproSyncRuntime();
const grpproSyncScheduler = new GrpproSyncScheduler({
  pipeline: grpproSyncRuntime.pipeline,
});
grpproSyncScheduler.start();

// Iniciar servidor
const PORT = Number(process.env.PORT) || 3005; 

app.listen(PORT, "0.0.0.0", () => {
  console.log(
    `🚀 Backend rodando em modo ${process.env.NODE_ENV || "development"}`
  );
  console.log(`📡 Servidor: ${process.env.API_SERVER_URL + ":" + process.env.PORT}`);
  console.log(`📚 Swagger: ${process.env.API_SERVER_URL + ":" + process.env.PORT + "/api/docs"}`);
  console.log(`❤️  Health Check: ${process.env.API_SERVER_URL + ":" + process.env.PORT + "/health"}`);
});
