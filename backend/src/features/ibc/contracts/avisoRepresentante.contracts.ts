import type { RouteContract } from "../../../docs/openapi/contracts";
import {
  appErrorSchema,
  internalServerErrorSchema,
  unauthorizedErrorSchema,
  validationErrorSchema,
} from "../../../docs/schemas/error.schemas";
import { avisoRepresentanteSchemas } from "../schemas/avisoRepresentante.schemas";

const authErrors = {
  "401": { description: "Não autenticado", schema: unauthorizedErrorSchema, componentName: "UnauthorizedError" },
  "403": {
    description: "Papel sem acesso ou aviso de outro representante (IBC_AVISO_FORBIDDEN)",
    schema: appErrorSchema,
    componentName: "IbcAvisoForbiddenError",
  },
  "500": { description: "Erro interno do servidor", schema: internalServerErrorSchema, componentName: "InternalServerError" },
} as const;

export const avisoRepresentanteContracts: RouteContract[] = [
  {
    method: "get",
    path: "/api/ibc/avisos",
    summary: "Lista avisos de IBC ao representante",
    description:
      "VENDAS vê só o codRep do JWT quando ele é inteiro maior que zero. codRep 999 não lista todos. ADMIN vê todos, do mais recente ao mais antigo.",
    tags: ["IBC"],
    security: [{ bearerAuth: [] }],
    responses: {
      "200": {
        description: "Avisos do escopo do usuário",
        schema: avisoRepresentanteSchemas.lista,
        componentName: "ListaAvisosRepresentante",
      },
      ...authErrors,
    },
  },
  {
    method: "patch",
    path: "/api/ibc/avisos/{id}/lido",
    summary: "Marca um aviso de IBC como lido",
    description: "A primeira chamada grava lidoEm. As seguintes mantêm esse instante.",
    tags: ["IBC"],
    security: [{ bearerAuth: [] }],
    validationSchema: avisoRepresentanteSchemas.marcarLido,
    request: { params: avisoRepresentanteSchemas.marcarLido.shape.params },
    responses: {
      "200": {
        description: "Aviso com lidoEm da primeira leitura",
        schema: avisoRepresentanteSchemas.aviso,
        componentName: "AvisoRepresentante",
      },
      "400": { description: "id inválido", schema: validationErrorSchema, componentName: "ValidationError" },
      "404": {
        description: "Aviso ausente (IBC_AVISO_NAO_ENCONTRADO)",
        schema: appErrorSchema,
        componentName: "IbcAvisoNaoEncontradoError",
      },
      ...authErrors,
    },
  },
];
