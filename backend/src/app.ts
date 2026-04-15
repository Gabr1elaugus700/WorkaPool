import "./config/env";

import express from "express";
import cors from "cors";
import { setupSwagger } from "./swagger";

import testeConectionRoutes from "./routes/testeConection";
import fatVenRoutes from "./routes/totalFatVendedorRoutes";
import rankingProdutosVendidos from "./routes/rankingProdutosRoutes";
import productRoutes from "./routes/produtosRoutes";
import vendedoresRoutes from "./routes/vendedoresRoutes";
import authRoutes from "./features/users/routes/authRoutes";
import clientesInativos from "./routes/clientesInativosRoutes";
import produtosEstoque from "./routes/estoqueProdutosRoutes";

//Importando as rotas De Consulta no banco de dados Prisma
import metasRoutes from "./routes/metasRoutes";
import caminhoes from "./routes/caminhoesRoutes";
import parametrosGlobaisFretes from "./routes/parametrosFretesRoutes";
import fretesRoutes from "./routes/fretesRoutes";

import ordemServico from "./features/workOrder/routes/osRoutes";
import itemChecklist from "./features/workOrder/routes/itemChecklistRoutes";
import departamentos from "./features/departamentos/routes/departamentosRoutes";
import checklistModelo from "./features/workOrder/routes/checklistModeloRoutes";
import vistoriaRoutes from "./features/workOrder/routes/vistoriaRoutes";
import checklistVistoria from "./features/workOrder/routes/chacklilstVistoriaRoutes";

import userRoutes from "./features/users/routes/userRoutes";
import cargoRoutes from "./features/cargo/http/routes/CargoRoute";

// New Routes After Refactor
import goals from "./features/goals/http/routes/goalsRoutes";
import ordersRoutes from "./features/orderLoss/http/routes/ordersRoutes";

const app = express();

setupSwagger(app);

const allowedOrigins = [
  "http://localhost:5858",
  "http://192.168.0.32:5858",
  "http://192.168.0.32:3005",
  "http://192.168.0.32:3001",
  "http://pooltecnica.no-ip.biz:5173",
  "http://localhost:5173",
  "http://192.168.0.32:5173",
  "http://pooltecnica.no-ip.biz:5173",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true); // Permitir requisições sem origin (Postman, curl)

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.warn(`❌ CORS bloqueado para: ${origin}`);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    environment: process.env.NODE_ENV || "development",
    port: process.env.PORT || 3005,
    timestamp: new Date().toISOString(),
  });
});


// Rotas De consulta no banco de dados Sapiens

app.use("/api/teste", testeConectionRoutes);
app.use("/api/faturamento", fatVenRoutes);
app.use("/api/rankingProdutos", rankingProdutosVendidos);
app.use("/api/produtos", productRoutes);
app.use("/api/vendedores", vendedoresRoutes);

//Cargas
app.use("/api/cargo", cargoRoutes);

//Clientes Perdidos
app.use("/api/clientes-inativos", clientesInativos);

//Produtos Em Estoque (5)
app.use("/api/produ tosEstoque", produtosEstoque);

// Rota de consultas Banco de dados Prisma
app.use("/api/auth", authRoutes);
app.use("/api/caminhoes", caminhoes);
app.use("/api/parametrosFretes", parametrosGlobaisFretes);

app.use("/api/fretes", fretesRoutes);

//Rotas de Ordem de Servico
app.use("/api/os", ordemServico);
app.use("/api/item-checklist", itemChecklist);
app.use("/api/checklist-modelo", checklistModelo);
app.use("/api/vistoria", vistoriaRoutes);
app.use("/api/checklist-vistoria", checklistVistoria);

app.use("/api/departamentos", departamentos);
app.use("/api/users", userRoutes);

// Imagens Uploads
app.use("/uploads", express.static("uploads"));
// Metas
app.use("/api/metas", metasRoutes);

// Declare new Goals routes
app.use("/api/goals", goals);

// Order Loss - Pedidos Perdidos e em Negociação
app.use("/api/orders", ordersRoutes);

// Iniciar servidor
app.use(
  (
  error: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error("❌ Erro no servidor:", error.message);

    if (process.env.NODE_ENV === "development") {
      res.status(500).json({
        error: error.message,
        stack: error.stack,
      });
    } else {
      res.status(500).json({
        error: "Internal Server Error",
      });
    }
  }
);

export { app }
