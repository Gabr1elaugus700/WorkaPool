import { Router } from "express";
import { Role } from "@prisma/client";
import { OrdersController } from "../controllers/OrdersController";
import { authMiddleware, requireRoles } from "../../../../middlewares/authMiddleware";

const router = Router();
const orderReadRoles: Role[] = [
  Role.ADMIN,
  Role.GERENTE_DPTO,
  Role.LOGISTICA,
  Role.VENDAS,
];
const orderWriteRoles: Role[] = [...orderReadRoles];

// Buscar pedidos perdidos do SAPIENS
router.get("/lost-sapiens", authMiddleware, requireRoles(orderReadRoles), OrdersController.getLostOrdersFromSapiens);

// CRUD básico de pedidos
router.post("/", authMiddleware, requireRoles(orderWriteRoles), OrdersController.create);
router.get("/", authMiddleware, requireRoles(orderReadRoles), OrdersController.getAll);
router.get("/seller/:codRep", authMiddleware, requireRoles(orderReadRoles), OrdersController.getPerSellerOrders);
router.get("/:id", authMiddleware, requireRoles(orderReadRoles), OrdersController.getById);
router.patch("/:id/status", authMiddleware, requireRoles(orderWriteRoles), OrdersController.updateStatus);


// Adicionar motivo de perda
router.post("/loss-reason", authMiddleware, requireRoles(orderWriteRoles), OrdersController.addLossReason);
// Atualizar motivo de perda (somente se justificativa existir e estiver dentro da janela)
router.put("/loss-reason", authMiddleware, requireRoles(orderWriteRoles), OrdersController.updateLossReason);

export default router;
