import { z } from "zod";
import type { RouteContract } from "../../../docs/openapi/contracts";
import {
  appErrorSchema,
  internalServerErrorSchema,
  unauthorizedErrorSchema,
  validationErrorSchema,
} from "../../../docs/schemas/error.schemas";
import { IbcConciliacaoHttpSchemas } from "../http/schemas/IbcConciliacaoSchema";

const bearer = [{ bearerAuth: [] }];
const codCarParams = z.object({ codCar: z.coerce.number().int() });

const produtoIncompativelSchema = z.object({
  error: z.string(),
  code: z.literal("IBC_PRODUTO_INCOMPATIVEL"),
  details: z.object({
    identificador: z.string(),
    grupoContainer: z.string().nullable(),
    gruposPermitidos: z.array(z.string()),
  }),
});

const conflito = {
  description:
    "Produto incompatível (IBC_PRODUTO_INCOMPATIVEL) com details { identificador, grupoContainer, gruposPermitidos }. Outros conflitos usam o mesmo envelope com details próprios.",
  schema: produtoIncompativelSchema,
  componentName: "IbcProdutoIncompativelError",
};

const comum = {
  "400": { description: "Entrada inválida", schema: validationErrorSchema, componentName: "ValidationError" },
  "401": { description: "Não autenticado", schema: unauthorizedErrorSchema, componentName: "UnauthorizedError" },
  "403": { description: "Papel sem escrita na viagem (IBC_VIAGEM_FORBIDDEN)", schema: appErrorSchema, componentName: "IbcViagemForbiddenError" },
  "409": conflito,
  "422": { description: "Ficou ou troca sem pedido elegível (IBC_CONCILIACAO_PEDIDO)", schema: appErrorSchema, componentName: "IbcConciliacaoPedidoError" },
  "500": { description: "Erro interno do servidor", schema: internalServerErrorSchema, componentName: "InternalServerError" },
};

const gravadaSchema = z.object({
  codCar: z.number(),
  expedicaoIbcId: z.string(),
  itens: z.array(z.object({
    alocacaoIbcId: z.string(),
    identificador: z.string(),
    destino: z.enum(["FICOU", "RETORNOU", "TROCA"]).nullable(),
    numPed: z.string().nullable(),
  })),
});

export const conciliacaoViagemContracts: RouteContract[] = [
  {
    method: "put",
    path: "/api/ibc/expedicoes/{codCar}/conciliacao",
    tags: ["IBC"],
    security: bearer,
    summary: "Grava o destino de cada container na volta",
    description:
      "Ficou e troca checam o container contra os gruposCodigo do pedido apontado: universal, ou grupo do container entre os grupos com configuração. Legado HM#### nunca é compatível. Retornou não checa produto.",
    validationSchema: IbcConciliacaoHttpSchemas.salvar,
    request: { params: codCarParams, body: IbcConciliacaoHttpSchemas.salvar },
    responses: {
      "200": { description: "Conciliação gravada", schema: gravadaSchema, componentName: "ConciliacaoViagemGravada" },
      ...comum,
    },
  },
  {
    method: "post",
    path: "/api/ibc/expedicoes/{codCar}/fechar-viagem",
    tags: ["IBC"],
    security: bearer,
    summary: "Fecha a viagem depois de repetir a compatibilidade",
    description:
      "Antes de gravar, repete a checagem de ficou e troca. Retornou não checa. O fechar expedição continua só pelo total da carga.",
    validationSchema: IbcConciliacaoHttpSchemas.fechar,
    request: { params: codCarParams, body: IbcConciliacaoHttpSchemas.fechar },
    responses: {
      "200": {
        description: "Viagem fechada",
        schema: z.object({ codCar: z.number(), expedicaoIbcId: z.string(), viagemFechadaEm: z.string().datetime() }),
        componentName: "ViagemIbcFechada",
      },
      ...comum,
    },
  },
];
