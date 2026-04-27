import type { RouteContract } from "../../../docs/openapi/contracts";
import {
  findAllUsersQuerySchema,
  getUserByIdSchema,
  updateUserSchema,
  deleteUserSchema,
  getUserDepartmentsSchema,
  paginatedUsersResponseSchema,
  userDepartmentsResponseSchema,
  userResponseSchema,
} from "../schemas/userSchemas";
import {
  appErrorSchema,
  internalServerErrorSchema,
  unauthorizedErrorSchema,
  validationErrorSchema,
} from "../../../docs/schemas/error.schemas";

const baseErrorResponses = {
  "400": {
    description: "Erro de validação de entrada",
    schema: validationErrorSchema,
    componentName: "ValidationError",
  },
  "401": {
    description: "Não autenticado",
    schema: unauthorizedErrorSchema,
    componentName: "UnauthorizedError",
  },
  "403": {
    description: "Acesso negado",
    schema: appErrorSchema,
    componentName: "ForbiddenError",
  },
  "422": {
    description: "Erro semântico de negócio",
    schema: appErrorSchema,
    componentName: "UnprocessableEntityError",
  },
  "500": {
    description: "Erro interno do servidor",
    schema: internalServerErrorSchema,
    componentName: "InternalServerError",
  },
} as const;

export const usersContracts: RouteContract[] = [
  {
    method: "get",
    path: "/api/users",
    summary: "Lista usuários com paginação/filtros",
    tags: ["Users"],
    validationSchema: findAllUsersQuerySchema,
    request: {
      query: findAllUsersQuerySchema.shape.query,
    },
    responses: {
      "200": { description: "Usuários listados", schema: paginatedUsersResponseSchema },
      ...baseErrorResponses,
    },
  },
  {
    method: "get",
    path: "/api/users/{id}",
    summary: "Busca usuário por ID",
    tags: ["Users"],
    validationSchema: getUserByIdSchema,
    request: {
      params: getUserByIdSchema.shape.params,
    },
    responses: {
      "200": { description: "Usuário encontrado", schema: userResponseSchema },
      "404": { description: "Usuário não encontrado", schema: appErrorSchema, componentName: "NotFoundError" },
      ...baseErrorResponses,
    },
  },
  {
    method: "get",
    path: "/api/users/{id}/departamentos",
    summary: "Lista departamentos vinculados ao usuário",
    tags: ["Users"],
    validationSchema: getUserDepartmentsSchema,
    request: {
      params: getUserDepartmentsSchema.shape.params,
    },
    responses: {
      "200": { description: "Departamentos do usuário", schema: userDepartmentsResponseSchema },
      "404": { description: "Usuário não encontrado", schema: appErrorSchema, componentName: "NotFoundError" },
      ...baseErrorResponses,
    },
  },
  {
    method: "put",
    path: "/api/users/{id}/update",
    summary: "Atualiza dados de um usuário",
    tags: ["Users"],
    validationSchema: updateUserSchema,
    request: {
      params: updateUserSchema.shape.params,
      body: updateUserSchema.shape.body,
    },
    responses: {
      "200": { description: "Usuário atualizado", schema: userResponseSchema },
      "404": { description: "Usuário não encontrado", schema: appErrorSchema, componentName: "NotFoundError" },
      "409": { description: "Conflito de dados", schema: appErrorSchema, componentName: "ConflictError" },
      ...baseErrorResponses,
    },
  },
  {
    method: "post",
    path: "/api/users/{id}/delete",
    summary: "Remove um usuário",
    tags: ["Users"],
    validationSchema: deleteUserSchema,
    request: {
      params: deleteUserSchema.shape.params,
    },
    responses: {
      "204": { description: "Usuário removido" },
      "404": { description: "Usuário não encontrado", schema: appErrorSchema, componentName: "NotFoundError" },
      ...baseErrorResponses,
    },
  },
];
