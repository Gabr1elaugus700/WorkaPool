import { z } from "zod";
import type { RouteContract } from "../../../docs/openapi/contracts";
import { appErrorSchema, internalServerErrorSchema, unauthorizedErrorSchema, validationErrorSchema } from "../../../docs/schemas/error.schemas";
import { IbcCadastroHttpSchemas, ibcCadastroResponseSchema, ibcHistoricoEventoSchema, ibcLoteResponseSchema } from "../http/schemas/IbcCadastroSchema";

const bearer = [{ bearerAuth: [] }];
const erro = (description: string, componentName: string) => ({ description, schema: appErrorSchema, componentName });
const comum = {
  "400": { description: "Entrada inválida", schema: validationErrorSchema, componentName: "ValidationError" },
  "401": { description: "Não autenticado", schema: unauthorizedErrorSchema, componentName: "UnauthorizedError" },
  "403": erro("Papel sem acesso ao cadastro de IBC", "IbcCadastroForbiddenError"),
  "409": erro("Identificador duplicado (IBC_IDENTIFICADOR_DUPLICADO)", "IbcIdentificadorDuplicadoError"),
  "422": erro("HM sem grupo (IBC_PRODUTO_OBRIGATORIO) ou grupo/universal sem configuração (IBC_PRODUTO_NAO_CONFIGURADO)", "IbcProdutoNaoConfiguradoError"),
  "500": { description: "Erro interno do servidor", schema: internalServerErrorSchema, componentName: "InternalServerError" },
};

export const ibcCadastroContracts: RouteContract[] = [
  {
    method: "post", path: "/api/ibc", tags: ["IBC"], security: bearer,
    summary: "Cadastra um container com HM+sigla, NH+sigla ou NH universal",
    description: "HM exige grupo configurado. NH sem grupo referencia a configuração universal. O sequencial é o próximo daquele prefixo exato.",
    validationSchema: IbcCadastroHttpSchemas.createNovo,
    request: { body: IbcCadastroHttpSchemas.createNovo.shape.body },
    responses: { "201": { description: "Container cadastrado, com corHex, universal e homologado", schema: ibcCadastroResponseSchema, componentName: "IbcCadastro" }, ...comum },
  },
  {
    method: "post", path: "/api/ibc/lote", tags: ["IBC"], security: bearer,
    summary: "Cadastra um lote no próximo sequencial do prefixo",
    description: "Mesma regra de grupo do cadastro unitário. Os identificadores do lote são consecutivos daquele prefixo.",
    validationSchema: IbcCadastroHttpSchemas.createLote,
    request: { body: IbcCadastroHttpSchemas.createLote.shape.body },
    responses: { "201": { description: "Lote cadastrado", schema: ibcLoteResponseSchema, componentName: "IbcLoteCadastro" }, ...comum },
  },
  {
    method: "get", path: "/api/ibc", tags: ["IBC"], security: bearer,
    summary: "Lista o pool com a placa da configuração",
    description: "Cada item traz corHex, universal e homologado. Legado sem produto vem com cor nula.",
    request: { query: z.object({ incluirBaixados: z.string().optional() }) },
    responses: {
      "200": { description: "Pool de containers", schema: z.array(ibcCadastroResponseSchema), componentName: "IbcCadastroLista" },
      "401": comum["401"], "500": comum["500"],
    },
  },
  {
    method: "patch", path: "/api/ibc/{id}/converter-nao-homologado", tags: ["IBC"], security: bearer,
    summary: "Converte HM em NH mantendo o grupo ou virando universal",
    description: "Destino manter_grupo gera NH+sigla do grupo atual. Legado HM#### sem produto envia grupoCodigo ou destino universal (prefixo NH). Grava a placa de antes e de depois no histórico.",
    request: {
      params: z.object({ id: z.string() }),
      body: IbcCadastroHttpSchemas.convertToNaoHomologado,
    },
    responses: {
      "201": { description: "Container NH criado", schema: ibcCadastroResponseSchema, componentName: "IbcCadastro" },
      "400": comum["400"], "401": comum["401"], "403": comum["403"],
      "404": erro("IBC não encontrado (IBC_NOT_FOUND)", "IbcNotFoundError"),
      "409": erro("Já NH, já substituído ou prefixo inválido", "IbcConversaoConflictError"),
      "422": erro("Universal ou grupo sem configuração (IBC_PRODUTO_NAO_CONFIGURADO) ou legado sem grupo (IBC_PRODUTO_OBRIGATORIO)", "IbcConversaoProdutoError"),
      "500": comum["500"],
    },
  },
  {
    method: "patch", path: "/api/ibc/{id}/produto", tags: ["IBC"], security: bearer,
    summary: "Troca o produto de um NH",
    description: "Aceita universal → grupo, grupo → grupo e grupo → universal. HM responde 409 IBC_HOMOLOGADO_PRODUTO_FIXO. O destino nunca é HM. Grava a placa no histórico.",
    request: {
      params: z.object({ id: z.string() }),
      body: IbcCadastroHttpSchemas.changeProduto,
    },
    responses: {
      "201": { description: "Container NH com o produto novo", schema: ibcCadastroResponseSchema, componentName: "IbcCadastro" },
      "400": comum["400"], "401": comum["401"], "403": comum["403"],
      "404": erro("IBC ou produto não encontrado", "IbcProdutoChangeNotFoundError"),
      "409": erro("HM (IBC_HOMOLOGADO_PRODUTO_FIXO), produto igual ou IBC já substituído", "IbcProdutoChangeConflictError"),
      "422": erro("Destino sem configuração de placa (IBC_PRODUTO_NAO_CONFIGURADO)", "IbcProdutoChangeConfigError"),
      "500": comum["500"],
    },
  },
  {
    method: "get", path: "/api/ibc/{id}/historico", tags: ["IBC"], security: bearer,
    summary: "Histórico de conversão e mudança de produto",
    description: "Cada evento traz identificador e cor de antes e de depois. Eventos antigos vêm com esses campos nulos.",
    request: { params: z.object({ id: z.string() }) },
    responses: {
      "200": { description: "Eventos da linhagem", schema: z.array(ibcHistoricoEventoSchema), componentName: "IbcHistorico" },
      "401": comum["401"], "403": comum["403"],
      "404": erro("IBC não encontrado (IBC_NOT_FOUND)", "IbcHistoricoNotFoundError"),
      "500": comum["500"],
    },
  },
];
