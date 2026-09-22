import type { RouteContract } from "../../../docs/openapi/contracts";
import {
  getOverviewCustomerAbcGroupsSchema,
  overviewCustomerAbcGroupsResponseSchema,
} from "../schemas/overviewCustomerAbcGroups.schemas";
import {
  getOverviewCustomerGroupAnaliseSchema,
  overviewCustomerGroupAnaliseResponseSchema,
} from "../schemas/overviewCustomerGroupAnalise.schemas";
import {
  getOverviewCustomerGroupGanhosSchema,
  overviewCustomerGroupGanhosResponseSchema,
} from "../schemas/overviewCustomerGroupGanhos.schemas";
import {
  appErrorSchema,
  internalServerErrorSchema,
  unauthorizedErrorSchema,
} from "../../../docs/schemas/error.schemas";

const overviewErrorResponses = {
  "400": {
    description: "clienteId inválido",
    schema: appErrorSchema,
    componentName: "OverviewCustomerInvalidIdError",
  },
  "401": {
    description: "Não autenticado",
    schema: unauthorizedErrorSchema,
    componentName: "UnauthorizedError",
  },
  "403": {
    description: "Acesso negado à carteira do Overview",
    schema: appErrorSchema,
    componentName: "OverviewCustomerForbiddenError",
  },
  "404": {
    description: "Cliente ausente do snapshot servido",
    schema: appErrorSchema,
    componentName: "OverviewCustomerNotFoundError",
  },
  "500": {
    description: "Erro interno do servidor",
    schema: internalServerErrorSchema,
    componentName: "InternalServerError",
  },
} as const;

export const overviewCustomerContracts: RouteContract[] = [
  {
    method: "get",
    path: "/api/overview/customers/{clienteId}/grupos",
    summary: "Lista os top 5 grupos ABC do cliente no Overview",
    description:
      "Curva ABC por CODGRP a partir do snapshot ganhos-por-grupo. OUTROS só entra se estiver no top 5. Sem chips de SKU.",
    tags: ["OverviewCustomer"],
    validationSchema: getOverviewCustomerAbcGroupsSchema,
    request: {
      params: getOverviewCustomerAbcGroupsSchema.shape.params,
    },
    responses: {
      "200": {
        description: "Até 5 grupos ordenados por share de faturamento",
        schema: overviewCustomerAbcGroupsResponseSchema,
      },
      ...overviewErrorResponses,
    },
  },
  {
    method: "get",
    path: "/api/overview/customers/{clienteId}/grupos/{grupoCodigo}/ganhos",
    summary: "Lista os TOP 5 ganhos do grupo no Overview",
    description:
      "Pedidos faturados do snapshot ganhos-por-grupo. Sem consulta Senior. grupoCodigo vazio retorna 400.",
    tags: ["OverviewCustomer"],
    validationSchema: getOverviewCustomerGroupGanhosSchema,
    request: {
      params: getOverviewCustomerGroupGanhosSchema.shape.params,
    },
    responses: {
      "200": {
        description: "Até 5 ganhos ordenados por data de emissão",
        schema: overviewCustomerGroupGanhosResponseSchema,
      },
      ...overviewErrorResponses,
      "400": {
        description: "clienteId ou grupoCodigo inválido",
        schema: appErrorSchema,
        componentName: "OverviewCustomerInvalidIdError",
      },
    },
  },
  {
    method: "get",
    path: "/api/overview/customers/{clienteId}/grupos/{grupoCodigo}/analise",
    summary: "Análise 5×5 do grupo: ganhos do snapshot e perdidos do Sapiens",
    description:
      "Ganhos vêm do snapshot. Perdidos são on-demand (sitped = 5) com join orderLoss. Falha Senior não devolve perdidos: [] de sucesso.",
    tags: ["OverviewCustomer"],
    validationSchema: getOverviewCustomerGroupAnaliseSchema,
    request: {
      params: getOverviewCustomerGroupAnaliseSchema.shape.params,
    },
    responses: {
      "200": {
        description:
          "Ganhos do snapshot e até 5 perdidos; perdidosFailed distingue erro Sapiens de lista vazia",
        schema: overviewCustomerGroupAnaliseResponseSchema,
      },
      ...overviewErrorResponses,
      "400": {
        description: "clienteId ou grupoCodigo inválido",
        schema: appErrorSchema,
        componentName: "OverviewCustomerInvalidIdError",
      },
    },
  },
];
