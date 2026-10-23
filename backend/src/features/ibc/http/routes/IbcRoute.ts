import { Router } from "express";
import { Role } from "@prisma/client";
import {
  authMiddleware,
  requireRoles,
} from "../../../../middlewares/authMiddleware";
import { validate } from "../../../../middlewares/validate";
import { ibcProdutoConfigSchemas } from "../schemas/IbcProdutoSchema";
import { IbcController } from "../controllers/IbcController";
import { IbcChecklistController } from "../controllers/IbcChecklistController";
import { IbcInspecaoController } from "../controllers/IbcInspecaoController";
import { IbcEntradaPatioController } from "../controllers/IbcEntradaPatioController";
import { IbcConciliacaoController } from "../controllers/IbcConciliacaoController";
import { createIbcAvisoRoutes } from "./IbcAvisoRoute";
import { createIbcConciliacaoErpRoutes } from "./IbcConciliacaoErpRoute";
import { createIbcEmprestimoAtrasadoRoutes } from "./IbcEmprestimoAtrasadoRoute";

const router = Router();

/** Leitura: ALMOX e ADMIN (e leitura ampla para alinhamento operacional). */
const ibcReadRoles: Role[] = [
  Role.ADMIN,
  Role.ALMOX,
  Role.LOGISTICA,
  Role.GERENTE_DPTO,
];

/** Mutações de preparação/expedição: somente ADMIN + ALMOX (LOGISTICA → 403). */
const ibcWriteRoles: Role[] = [Role.ADMIN, Role.ALMOX];

const readAuth = [authMiddleware, requireRoles(ibcReadRoles)];
const writeAuth = [authMiddleware, requireRoles(ibcWriteRoles)];

router.get("/checklist-itens", readAuth, IbcChecklistController.listItens);
router.post("/checklist-itens", writeAuth, IbcChecklistController.createItem);
router.patch("/checklist-itens/:itemId", writeAuth, IbcChecklistController.updateItem);

router.get("/checklists", readAuth, IbcChecklistController.listChecklists);
router.post("/checklists", writeAuth, IbcChecklistController.createChecklist);
router.get("/checklists/:checklistId", readAuth, IbcChecklistController.getChecklist);
router.patch("/checklists/:checklistId", writeAuth, IbcChecklistController.updateChecklist);

router.post(
  "/",
  authMiddleware,
  requireRoles(ibcWriteRoles),
  IbcController.createNovoIbc,
);

router.get("/produtos", readAuth, IbcController.listProdutoConfig);
router.put(
  "/produtos/universal",
  writeAuth,
  validate(ibcProdutoConfigSchemas.salvarUniversal),
  IbcController.saveProdutoUniversal,
);
router.put(
  "/produtos/grupos/:grupoCodigo",
  writeAuth,
  validate(ibcProdutoConfigSchemas.salvarGrupo),
  IbcController.saveProdutoGrupo,
);

router.post(
  "/lote",
  authMiddleware,
  requireRoles(ibcWriteRoles),
  IbcController.createLoteIbc,
);

router.get(
  "/",
  authMiddleware,
  requireRoles(ibcReadRoles),
  IbcController.listPool,
);

router.get(
  "/alerts",
  authMiddleware,
  requireRoles(ibcReadRoles),
  IbcController.listAlerts,
);

router.use("/avisos", createIbcAvisoRoutes());

router.get("/entradas-patio", writeAuth, IbcEntradaPatioController.listar);

router.use("/conciliacao-erp", createIbcConciliacaoErpRoutes());

router.use("/emprestimos-atrasados", createIbcEmprestimoAtrasadoRoutes());

router.patch(
  "/:id",
  authMiddleware,
  requireRoles(ibcWriteRoles),
  IbcController.patchDataLimite,
);

router.get(
  "/:id/historico",
  authMiddleware,
  requireRoles(ibcReadRoles),
  IbcController.listHistorico,
);

router.get("/:id/checklists", readAuth, IbcChecklistController.listVinculos);
router.post("/:id/checklists", writeAuth, IbcChecklistController.vincular);
router.delete("/:id/checklists/:checklistModeloId", writeAuth, IbcChecklistController.desvincular);

router.get("/:id/inspecoes", readAuth, IbcInspecaoController.listar);
router.post("/:id/inspecoes", writeAuth, IbcInspecaoController.registrar);

router.post("/:id/entrada-patio", writeAuth, IbcEntradaPatioController.abrir);
router.post("/:id/entrada-patio/concluir", writeAuth, IbcEntradaPatioController.concluir);

router.patch(
  "/:id/converter-nao-homologado",
  authMiddleware,
  requireRoles(ibcWriteRoles),
  IbcController.convertToNaoHomologado,
);

router.patch(
  "/:id/produto",
  authMiddleware,
  requireRoles(ibcWriteRoles),
  IbcController.changeProduto,
);

router.delete(
  "/:id",
  authMiddleware,
  requireRoles(ibcWriteRoles),
  IbcController.softDelete,
);

router.get(
  "/cargas-expedicao",
  authMiddleware,
  requireRoles(ibcReadRoles),
  IbcController.listCargasExpedicao,
);

router.get(
  "/events",
  authMiddleware,
  requireRoles(ibcReadRoles),
  IbcController.streamEvents,
);

router.get(
  "/cargas-expedicao/:codCar",
  authMiddleware,
  requireRoles(ibcReadRoles),
  IbcController.getCargaExpedicaoDetail,
);

router.post(
  "/alocacoes",
  authMiddleware,
  requireRoles(ibcWriteRoles),
  IbcController.createAlocacao,
);

/** DELETE by alocacao id (UUID). Documented alternative to identificador+codCar. */
router.delete(
  "/alocacoes/:id",
  authMiddleware,
  requireRoles(ibcWriteRoles),
  IbcController.removeAlocacao,
);

router.get(
  "/expedicoes/em-viagem",
  authMiddleware,
  requireRoles(ibcWriteRoles),
  IbcController.listCargasEmViagem,
);

router.get(
  "/expedicoes/:codCar/relatorio-viagem",
  authMiddleware,
  requireRoles(ibcWriteRoles),
  IbcController.getRelatorioViagem,
);

router.get(
  "/expedicoes/:codCar/conciliacao",
  authMiddleware,
  requireRoles(ibcWriteRoles),
  IbcConciliacaoController.consultar,
);

router.put(
  "/expedicoes/:codCar/conciliacao",
  authMiddleware,
  requireRoles(ibcWriteRoles),
  IbcConciliacaoController.salvar,
);

router.post(
  "/expedicoes/:codCar/conciliacao/trocas",
  authMiddleware,
  requireRoles(ibcWriteRoles),
  IbcConciliacaoController.registrarTroca,
);

router.post(
  "/expedicoes/:codCar/fechar-viagem",
  authMiddleware,
  requireRoles(ibcWriteRoles),
  IbcConciliacaoController.fecharViagem,
);

router.post(
  "/expedicoes",
  authMiddleware,
  requireRoles(ibcWriteRoles),
  IbcController.fecharExpedicao,
);

export default router;
