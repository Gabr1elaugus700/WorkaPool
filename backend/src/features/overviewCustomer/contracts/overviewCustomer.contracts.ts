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
  createOverviewCustomerObservationBodyContractSchema,
  listOverviewCustomerObservationsQuerySchema,
  overviewCustomerObservationListResponseSchema,
  overviewCustomerObservationParamsSchema,
  overviewCustomerObservationSchema,
} from "../schemas/overviewCustomerObservation.schemas";
import {
  appErrorSchema,
  internalServerErrorSchema,
  unauthorizedErrorSchema,
} from "../../../docs/schemas/error.schemas";

const overviewErrorResponses = {
  "400": {
    description: "clienteId inválido (OVERVIEW_CUSTOMER_INVALID_ID)",
    schema: appErrorSchema,
    componentName: "OverviewCustomerInvalidIdError",
  },
  "401": {
    description: "Não autenticado",
    schema: unauthorizedErrorSchema,
    componentName: "UnauthorizedError",
  },
  "403": {
    description: "Acesso negado à carteira do Overview (OVERVIEW_CUSTOMER_FORBIDDEN)",
    schema: appErrorSchema,
    componentName: "OverviewCustomerForbiddenError",
  },
  "404": {
    description: "Cliente ausente do snapshot servido (OVERVIEW_CUSTOMER_NOT_FOUND)",
    schema: appErrorSchema,
    componentName: "OverviewCustomerNotFoundError",
  },
  "500": {
    description: "Erro interno do servidor (INTERNAL_ERROR)",
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
  {
    method: "get",
    path: "/api/overview/customers/{clienteId}/observations",
    summary: "Lista observações do cliente no Overview",
    description:
      "Página de até 50 observações em ordem cronológica ascendente (mais antiga primeiro). Para carregar mais antigas, enviar beforeCreatedAt e beforeId juntos a partir de nextBefore.",
    tags: ["OverviewCustomer"],
    request: {
      params: overviewCustomerObservationParamsSchema,
      query: listOverviewCustomerObservationsQuerySchema,
    },
    responses: {
      "200": {
        description: "Página de observações; hasOlder indica se há mais antigas",
        schema: overviewCustomerObservationListResponseSchema,
      },
      ...overviewErrorResponses,
      "400": {
        description:
          "clienteId inválido (OVERVIEW_CUSTOMER_INVALID_ID) ou cursor de paginação inválido (OBSERVATION_INVALID_CURSOR)",
        schema: appErrorSchema,
        componentName: "OverviewCustomerObservationListBadRequestError",
      },
    },
  },
  {
    method: "post",
    path: "/api/overview/customers/{clienteId}/observations",
    summary: "Registra observação do cliente no Overview",
    description:
      "Autor vem do JWT. O body é aparado (trim) e precisa ter de 1 a 2000 caracteres. Acesso à carteira é verificado antes da validação do body.",
    tags: ["OverviewCustomer"],
    request: {
      params: overviewCustomerObservationParamsSchema,
      body: createOverviewCustomerObservationBodyContractSchema,
    },
    responses: {
      "201": {
        description: "Observação criada",
        schema: overviewCustomerObservationSchema,
      },
      ...overviewErrorResponses,
      "400": {
        description:
          "clienteId inválido (OVERVIEW_CUSTOMER_INVALID_ID) ou body vazio/acima de 2000 caracteres (OBSERVATION_INVALID_BODY)",
        schema: appErrorSchema,
        componentName: "OverviewCustomerObservationCreateBadRequestError",
      },
    },
  },
];
