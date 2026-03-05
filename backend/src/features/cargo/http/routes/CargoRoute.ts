import { Router } from "express";
import { CargoController } from "../controllers/CargoController";
const router = Router();

router.post("/", CargoController.createCarga);
router.patch("/:id/situacao", CargoController.updateSituacao);
router.put("/update-carga/:id", CargoController.updateCarga);
router.get("/listar-abertas", CargoController.getAllOpenCargas);

router.put("/update-pedido/:numPed", CargoController.updatePedidoCarga); // Sapiens Database - Rota para atualizar pedido com carga
router.get(
  "/pedidos-fechados/:codRep",
  CargoController.getPedidosFechadosPorVendedor,  
); // Sapiens Database - Rota para obter pedidos fechados por vendedor
router.get("/:codCar/pedidos", CargoController.getPedidosPorCarga); // Sapiens Database - Rota para obter pedidos de uma carga específica

export default router;
