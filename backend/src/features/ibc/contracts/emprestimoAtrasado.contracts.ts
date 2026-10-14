import type { RouteContract } from "../../../docs/openapi/contracts";
import {
  appErrorSchema,
  internalServerErrorSchema,
  unauthorizedErrorSchema,
} from "../../../docs/schemas/error.schemas";
import { emprestimoAtrasadoSchemas } from "../schemas/emprestimoAtrasado.schemas";

const authErrors = {
  "401": {
    description: "Não autenticado",
    schema: unauthorizedErrorSchema,
    componentName: "UnauthorizedError",
  },
  "403": {
    description:
      "ALMOX, USER e MOTORISTA não leem empréstimos em atraso (IBC_EMPRESTIMO_ATRASADO_FORBIDDEN)",
    schema: appErrorSchema,
    componentName: "IbcEmprestimoAtrasadoForbiddenError",
  },
  "500": {
    description: "Erro interno do servidor",
    schema: internalServerErrorSchema,
    componentName: "InternalServerError",
  },
} as const;

export const emprestimoAtrasadoContracts: RouteContract[] = [
  {
    method: "get",
    path: "/api/ibc/emprestimos-atrasados",
    summary: "Lista empréstimos de IBC com prazo de devolução vencido",
    description:
      "Somente leitura do prazo já gravado. ADMIN, LOGISTICA e GERENTE_DPTO veem todos. VENDAS vê só o codRep do JWT; sem codRep inteiro maior que zero a lista vem vazia (999 é um representante, não curinga). Sem query, sem paginação e sem flag de atraso na conciliação ERP.",
    tags: ["IBC"],
    security: [{ bearerAuth: [] }],
    responses: {
      "200": {
        description: "Empréstimos atrasados do escopo, do prazo mais antigo ao mais novo",
        schema: emprestimoAtrasadoSchemas.lista,
        componentName: "ListaEmprestimosAtrasados",
      },
      ...authErrors,
    },
  },
];
