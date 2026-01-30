import { Router } from "express";
import { OrdersController } from "../controllers/OrdersController";

const router = Router();

// Buscar pedidos perdidos do SAPIENS
router.get("/lost-sapiens", OrdersController.getLostOrdersFromSapiens);

// CRUD básico de pedidos
router.post("/", OrdersController.create);
router.get("/", OrdersController.getAll);
router.get("/:id", OrdersController.getById);
router.get("/seller/:codRep", OrdersController.getPerSellerOrders);
router.patch("/:id/status", OrdersController.updateStatus);


// Adicionar motivo de perda
router.post("/loss-reason", OrdersController.addLossReason);

export default router;
