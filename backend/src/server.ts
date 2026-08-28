// PRIMEIRO: Configurar variáveis de ambiente
import { app } from "./app";
import "./config/env";
import { IbcEventConsumer } from "./features/ibc/realtime/IbcEventConsumer";

// Iniciar servidor
const PORT = Number(process.env.PORT) || 3005; 

app.listen(PORT, "0.0.0.0", () => {
  console.log(
    `🚀 Backend rodando em modo ${process.env.NODE_ENV || "development"}`
  );
  console.log(`📡 Servidor: ${process.env.API_SERVER_URL + ":" + process.env.PORT}`);
  console.log(`📚 Swagger: ${process.env.API_SERVER_URL + ":" + process.env.PORT + "/api/docs"}`);
  console.log(`❤️  Health Check: ${process.env.API_SERVER_URL + ":" + process.env.PORT + "/health"}`);

  try {
    const consumer = new IbcEventConsumer();
    void consumer.start().catch((error: unknown) => {
      console.error(
        "IBC event consumer indisponível:",
        error instanceof Error ? error.message : error,
      );
    });
  } catch (error: unknown) {
    console.error(
      "IBC event consumer não configurado:",
      error instanceof Error ? error.message : error,
    );
  }
});
