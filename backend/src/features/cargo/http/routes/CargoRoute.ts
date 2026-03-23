import { Router } from "express";
import { CargoController } from "../controllers/CargoController";
const router = Router();

router.post("/", CargoController.createCarga);
router.post("/close-carga", CargoController.closeCarga);

router.patch("/:id/situacao", CargoController.updateSituacao);
router.put("/update-carga/:id", CargoController.updateCarga);
router.get("/listar-cargas", CargoController.getCargas);

router.put("/update-pedido/:numPed", CargoController.updatePedidoCarga); // Sapiens Database - Rota para atualizar pedido com carga

// Nova rota: GET /pedidos-fechados (todos) ou GET /pedidos-fechados?codRep=X
router.get("/pedidos-fechados", CargoController.getPedidos);
// Rota compatível: GET /pedidos-fechados/:codRep
router.get("/pedidos-fechados/:codRep", CargoController.getPedidos);

router.get("/cargas-fechadas", CargoController.getCargasFechadas); // Buscar cargas fechadas com pedidos salvos
router.get("/:codCar/pedidos", CargoController.getPedidosPorCarga); // Sapiens Database - Rota para obter pedidos de uma carga específica

export default router;
