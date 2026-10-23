import type { OpenApiResponseContract, RouteContract } from "../../../docs/openapi/contracts";
import { appErrorSchema, internalServerErrorSchema, unauthorizedErrorSchema, validationErrorSchema } from "../../../docs/schemas/error.schemas";
import { ibcProdutoConfigSchemas } from "../http/schemas/IbcProdutoSchema";

const bearer = [{ bearerAuth: [] }];
const erro = (description: string, componentName: string) => ({ description, schema: appErrorSchema, componentName });
const comum = {
  "401": { description: "Não autenticado", schema: unauthorizedErrorSchema, componentName: "UnauthorizedError" },
  "403": erro("Papel sem acesso (IBC_PRODUTO_CONFIG_FORBIDDEN)", "IbcProdutoConfigForbiddenError"),
  "500": { description: "Erro interno do servidor", schema: internalServerErrorSchema, componentName: "InternalServerError" },
};
const conflito = { "409": erro("Config em uso (IBC_PRODUTO_CONFIG_EM_USO), cor repetida (IBC_PRODUTO_COR_EM_USO) ou sigla repetida (IBC_PRODUTO_SIGLA_DUPLICADA)", "IbcProdutoConfigConflictError") };
const invalido = { "400": { description: "Entrada inválida", schema: validationErrorSchema, componentName: "ValidationError" } };
const ok = (description: string, schema: NonNullable<OpenApiResponseContract["schema"]>, componentName: string) => ({ description, schema, componentName });

export const ibcProdutoConfigContracts: RouteContract[] = [
  {
    method: "get", path: "/api/ibc/produtos", tags: ["IBC"], security: bearer,
    summary: "Lista grupos do catálogo com a configuração de placa",
    description: "Grupos vêm de produto_grupo_map. A linha universal vem sempre. Leitura: ADMIN, ALMOX, LOGISTICA e GERENTE_DPTO.",
    responses: { "200": ok("Universal e grupos; config ausente no Sapiens continua na lista", ibcProdutoConfigSchemas.lista, "ListaIbcProdutoConfig"), ...comum },
  },
  {
    method: "put", path: "/api/ibc/produtos/universal", tags: ["IBC"], security: bearer,
    summary: "Grava a cor da placa do container universal",
    description: "Cria ou atualiza o único registro universal. Escrita: ADMIN e ALMOX, conferida no use case.",
    validationSchema: ibcProdutoConfigSchemas.salvarUniversal,
    request: { body: ibcProdutoConfigSchemas.salvarUniversal.shape.body },
    responses: { "200": ok("Configuração universal gravada", ibcProdutoConfigSchemas.universal, "IbcProdutoUniversalConfig"), ...invalido, ...conflito, ...comum },
  },
  {
    method: "put", path: "/api/ibc/produtos/grupos/{grupoCodigo}", tags: ["IBC"], security: bearer,
    summary: "Grava sigla e cor da placa de um grupo",
    description: "O grupo precisa existir no catálogo na criação. Config que sumiu do Sapiens continua editável. Escrita: ADMIN e ALMOX.",
    validationSchema: ibcProdutoConfigSchemas.salvarGrupo,
    request: { params: ibcProdutoConfigSchemas.salvarGrupo.shape.params, body: ibcProdutoConfigSchemas.salvarGrupo.shape.body },
    responses: {
      "200": ok("Configuração do grupo gravada", ibcProdutoConfigSchemas.grupo, "IbcProdutoGrupoConfig"), ...invalido,
      "404": erro("Grupo fora do catálogo ao criar (IBC_PRODUTO_GRUPO_NAO_ENCONTRADO)", "IbcProdutoGrupoNaoEncontradoError"), ...conflito, ...comum,
    },
  },
];
