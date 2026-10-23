import { z } from "zod";
import type { RouteContract } from "../../../docs/openapi/contracts";
import { appErrorSchema, internalServerErrorSchema, unauthorizedErrorSchema, validationErrorSchema } from "../../../docs/schemas/error.schemas";
import { IbcCadastroHttpSchemas, ibcCadastroResponseSchema, ibcLoteResponseSchema } from "../http/schemas/IbcCadastroSchema";

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
];
