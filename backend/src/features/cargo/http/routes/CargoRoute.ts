import { Router } from "express";
import { Role } from "@prisma/client";
import { CargoController } from "../controllers/CargoController";
import { authMiddleware, requireRoles } from "../../../../middlewares/authMiddleware";
const router = Router();

const cargoReadRoles: Role[] = [
  Role.ADMIN,
  Role.USER,
  Role.VENDAS,
  Role.LOGISTICA,
  Role.ALMOX,
  Role.GERENTE_DPTO,
];


const cargoWriteRoles: Role[] = [Role.ADMIN, Role.LOGISTICA, Role.GERENTE_DPTO, Role.VENDAS];

router.post("/", authMiddleware, requireRoles(cargoWriteRoles), CargoController.createCarga);
router.post("/close-carga", authMiddleware, requireRoles(cargoWriteRoles), CargoController.closeCarga);

router.patch("/:codCar/situacao", authMiddleware, requireRoles(cargoWriteRoles), CargoController.updateSituacao);
router.put("/update-carga/:id", authMiddleware, requireRoles(cargoWriteRoles), CargoController.updateCarga);
router.get("/listar-cargas", authMiddleware, requireRoles(cargoReadRoles), CargoController.getCargas);

router.put("/update-pedido/:numPed", authMiddleware, requireRoles(cargoWriteRoles), CargoController.updatePedidoCarga); // Sapiens Database - Rota para atualizar pedido com carga

// Nova rota: GET /pedidos-fechados (todos) ou GET /pedidos-fechados?codRep=X
router.get("/pedidos-fechados", authMiddleware, requireRoles(cargoReadRoles), CargoController.getPedidos);
// Rota compatível: GET /pedidos-fechados/:codRep
router.get("/pedidos-fechados/:codRep", authMiddleware, requireRoles(cargoReadRoles), CargoController.getPedidos);

router.get("/cargas-fechadas", authMiddleware, requireRoles(cargoReadRoles), CargoController.getCargasFechadas); // Buscar cargas fechadas com pedidos salvos
router.get("/:codCar/pedidos", authMiddleware, requireRoles(cargoReadRoles), CargoController.getPedidosPorCarga); // Sapiens Database - Rota para obter pedidos de uma carga específica

export default router;
