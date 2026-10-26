import { z } from "zod";
import type { RouteContract } from "../../../docs/openapi/contracts";
import {
  appErrorSchema,
  internalServerErrorSchema,
  unauthorizedErrorSchema,
} from "../../../docs/schemas/error.schemas";
import { containersCargaSchemas } from "../schemas/containersCarga.schemas";

export const containersCargaContracts: RouteContract[] = [
  {
    method: "get",
    path: "/api/ibc/cargas-expedicao/{codCar}/containers",
    summary: "Lista os containers da paleta de Preparação da carga",
    description:
      "Vinculados à carga (com alocacaoId) e disponíveis para vincular: ativos, aptos, no pátio, sem alocação aberta e compatíveis com os grupos configurados dos pedidos elegíveis, ou universais. HM#### legado fica de fora. Mesmas regras de POST /api/ibc/alocacoes. Com a expedição fechada, só os vinculados.",
    tags: ["IBC"],
    security: [{ bearerAuth: [] }],
    request: { params: z.object({ codCar: z.coerce.number().int() }) },
    responses: {
      "200": { description: "Containers da carga e grupos aceitos", schema: containersCargaSchemas.resposta, componentName: "ContainersCarga" },
      "400": { description: "codCar inválido (IBC_COD_CAR_INVALID)", schema: appErrorSchema, componentName: "IbcCodCarInvalidError" },
      "401": { description: "Não autenticado", schema: unauthorizedErrorSchema, componentName: "UnauthorizedError" },
      "403": { description: "Papel sem leitura de IBC", schema: appErrorSchema, componentName: "IbcContainersCargaForbiddenError" },
      "404": { description: "Carga não encontrada", schema: appErrorSchema, componentName: "IbcCargaNotFoundError" },
      "500": { description: "Erro interno do servidor", schema: internalServerErrorSchema, componentName: "InternalServerError" },
    },
  },
];
