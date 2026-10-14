import type { RouteContract } from "../../../docs/openapi/contracts";
import {
  appErrorSchema,
  internalServerErrorSchema,
  unauthorizedErrorSchema,
} from "../../../docs/schemas/error.schemas";
import { conciliacaoErpSchemas } from "../schemas/conciliacaoErp.schemas";

const authErrors = {
  "401": {
    description: "Não autenticado",
    schema: unauthorizedErrorSchema,
    componentName: "UnauthorizedError",
  },
  "403": {
    description: "VENDAS, USER e MOTORISTA não leem a conciliação (IBC_CONCILIACAO_ERP_FORBIDDEN)",
    schema: appErrorSchema,
    componentName: "IbcConciliacaoErpForbiddenError",
  },
  "500": {
    description: "Erro interno do servidor",
    schema: internalServerErrorSchema,
    componentName: "InternalServerError",
  },
} as const;

export const conciliacaoErpContracts: RouteContract[] = [
  {
    method: "get",
    path: "/api/ibc/conciliacao-erp",
    summary: "Concilia o saldo ERP do IBC com os buckets do WorkaPool",
    description:
      "Somente leitura do saldo fiscal (codpro 251001) contra o pool. Sem bucket devolve o resumo e itens vazio. Com bucket lista esse recorte, ordenado por identificador. Residual = saldo ERP − vivos, com sinal; null se o ERP estiver indisponível. NF sem serializar fica indisponível. Papéis: ADMIN, ALMOX, LOGISTICA e GERENTE_DPTO.",
    tags: ["IBC"],
    security: [{ bearerAuth: [] }],
    validationSchema: conciliacaoErpSchemas.consulta,
    request: { query: conciliacaoErpSchemas.consulta.shape.query },
    responses: {
      "200": {
        description: "Resumo da conciliação e, se houver bucket, a lista do recorte",
        schema: conciliacaoErpSchemas.relatorio,
        componentName: "ConciliacaoErp",
      },
      "400": {
        description: "Bucket desconhecido (IBC_CONCILIACAO_ERP_BUCKET_INVALIDO)",
        schema: appErrorSchema,
        componentName: "IbcConciliacaoErpBucketInvalidoError",
      },
      ...authErrors,
    },
  },
];
