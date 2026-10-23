import type { AvisoPedidoGrupoSemConfigDTO } from "../types/ibcExpedicao.types";

type AlvoProdutoIbc = "carga" | "pedido";

const CODIGO_INCOMPATIVEL = "IBC_PRODUTO_INCOMPATIVEL";
const CODIGO_SEM_CONFIG = "IBC_PEDIDO_GRUPO_SEM_CONFIG";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function textos(grupos: readonly string[]): string {
  const lista = grupos.map((grupo) => grupo.trim()).filter((grupo) => grupo.length > 0);
  if (lista.length <= 1) return lista[0] ?? "";
  return `${lista.slice(0, -1).join(", ")} e ${lista[lista.length - 1]}`;
}

function frase(texto: string): string {
  const limpo = texto.trim();
  if (limpo.length === 0) return "";
  return /[.!?…]$/.test(limpo) ? limpo : `${limpo}.`;
}

function mensagemIncompativel(details: unknown, alvo: AlvoProdutoIbc): string {
  const record = isRecord(details) ? details : {};
  const identificador = typeof record.identificador === "string" ? record.identificador.trim() : "";
  const grupoBruto = record.grupoContainer;
  const grupo = typeof grupoBruto === "string" && grupoBruto.trim().length > 0 ? grupoBruto.trim() : null;
  const grupos = Array.isArray(record.gruposPermitidos)
    ? record.gruposPermitidos.filter((item): item is string => typeof item === "string")
    : [];
  const container = identificador ? `O container ${identificador}` : "O container";
  const origem = grupo
    ? `${container} é de outro produto (grupo ${grupo}).`
    : `${container} é de outro produto e não tem grupo na placa.`;
  const quem = alvo === "carga" ? "Esta carga" : "Este pedido";
  const aceitos = textos(grupos);
  const aceita = aceitos ? `${quem} aceita ${aceitos}.` : `${quem} só aceita container universal.`;
  return `${origem} ${aceita}`;
}

function fallbackAviso(aviso: AvisoPedidoGrupoSemConfigDTO): string {
  const grupos = textos(aviso.gruposCodigo);
  if (!grupos) {
    return `Pedido ${aviso.numPed}: grupo sem configuração de placa e cor. Só o container universal atende.`;
  }
  const rotulo = aviso.gruposCodigo.length > 1
    ? `grupos ${grupos} não têm`
    : `grupo ${grupos} não tem`;
  return `Pedido ${aviso.numPed}: ${rotulo} configuração de placa e cor. Só o container universal atende.`;
}

function textoAviso(aviso: AvisoPedidoGrupoSemConfigDTO): string {
  const base = frase(aviso.message) || fallbackAviso(aviso);
  return base.includes("A carga segue") ? base : `${base} A carga segue.`;
}

/**
 * Textos de compatibilidade de produto na saída e na volta.
 * Retornou não entra aqui: o backend não checa esse destino.
 */
export const ibcProdutoCompatibilidade = {
  tituloIncompativel: "Container de outro produto",

  ehIncompativel(message: string): boolean {
    return message.includes("é de outro produto");
  },

  mensagemIncompativel,

  mensagemConflito(body: unknown, alvo: AlvoProdutoIbc): string | null {
    if (!isRecord(body) || body.code !== CODIGO_INCOMPATIVEL) return null;
    return mensagemIncompativel(body.details, alvo);
  },

  avisosDe(value: unknown): AvisoPedidoGrupoSemConfigDTO[] {
    if (!Array.isArray(value)) return [];
    return value.flatMap((item) => {
      if (!isRecord(item) || item.code !== CODIGO_SEM_CONFIG) return [];
      const numPed = typeof item.numPed === "string" ? item.numPed.trim() : "";
      if (!numPed) return [];
      const gruposCodigo = Array.isArray(item.gruposCodigo)
        ? item.gruposCodigo.filter((grupo): grupo is string => typeof grupo === "string" && grupo.trim().length > 0)
        : [];
      const message = typeof item.message === "string" ? item.message.trim() : "";
      return [{ code: CODIGO_SEM_CONFIG, numPed, gruposCodigo, message }];
    });
  },

  textoAviso,
  textoAvisos(avisos: readonly AvisoPedidoGrupoSemConfigDTO[]): string {
    return avisos.map((aviso) => textoAviso(aviso)).join(" ");
  },
};
