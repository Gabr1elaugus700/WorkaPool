import type {
  ConciliacaoViagemDTO,
  ConciliacaoViagemItemDTO,
  DestinoConciliacao,
  PedidoConciliacaoDTO,
} from "../types/conciliacaoViagem.types";
import type { ContainerPaletaDTO, PlacaGrupoPaletaDTO } from "../types/ibcExpedicao.types";

function apontaPedido(item: ConciliacaoViagemItemDTO): boolean {
  return (item.destino === "FICOU" || item.destino === "TROCA") && item.numPed != null;
}

function barras(
  pedidos: readonly PedidoConciliacaoDTO[],
  itens: readonly ConciliacaoViagemItemDTO[],
): PedidoConciliacaoDTO[] {
  return pedidos.map((pedido) => ({
    ...pedido,
    quantidadeApontada: itens.filter((item) => apontaPedido(item) && item.numPed === pedido.numPed).length,
  }));
}

function divergentes(pedidos: readonly PedidoConciliacaoDTO[]): PedidoConciliacaoDTO[] {
  return pedidos.filter((pedido) => pedido.quantidadeApontada !== pedido.quantidadeEsperada);
}

function confirmacoes(pedidos: readonly PedidoConciliacaoDTO[]): Array<{ numPed: string }> {
  return divergentes(pedidos).map((pedido) => ({ numPed: pedido.numPed }));
}

const LEGADO_SEM_PRODUTO = /^HM\d{4}$/;

function compareOrdemEntrega(a: Pick<PedidoConciliacaoDTO, "posCar" | "numPed">, b: Pick<PedidoConciliacaoDTO, "posCar" | "numPed">): number {
  const posA = a.posCar ?? Number.POSITIVE_INFINITY;
  const posB = b.posCar ?? Number.POSITIVE_INFINITY;
  return posA !== posB ? posA - posB : a.numPed.localeCompare(b.numPed, undefined, { numeric: true });
}

function temDestino(item: ConciliacaoViagemItemDTO): boolean {
  return item.destino === "RETORNOU" || apontaPedido(item);
}

function ehCompativel(item: ConciliacaoViagemItemDTO, grupos: readonly string[]): boolean {
  if (LEGADO_SEM_PRODUTO.test(item.identificador.trim().toUpperCase())) return false;
  if (item.universal) return true;
  const grupo = item.grupoCodigo?.trim() ?? "";
  return grupo.length > 0 && grupos.some((codigo) => codigo.trim() === grupo);
}

function chip(item: ConciliacaoViagemItemDTO): ContainerPaletaDTO {
  return { identificador: item.identificador, alocacaoId: item.alocacaoIbcId, grupoCodigo: item.grupoCodigo, corHex: item.corHex, universal: item.universal, homologado: item.homologado };
}

function agruparPorSecao(itens: readonly ConciliacaoViagemItemDTO[], gruposPaleta: readonly PlacaGrupoPaletaDTO[]) {
  const placas = new Map(gruposPaleta.map((p) => [p.grupoCodigo, p]));
  const porGrupo = new Map<string, ConciliacaoViagemItemDTO[]>();
  for (const item of itens) {
    const codigo = item.universal ? "" : (item.grupoCodigo?.trim() ?? "");
    if (!codigo) continue;
    let lista = porGrupo.get(codigo);
    if (!lista) porGrupo.set(codigo, (lista = []));
    lista.push(item);
  }
  const grupos = [...new Set([...gruposPaleta.map((p) => p.grupoCodigo), ...porGrupo.keys()])].flatMap((codigo) => {
    const lista = porGrupo.get(codigo);
    const p = placas.get(codigo);
    return lista?.length ? [{ tipo: "grupo" as const, grupoCodigo: codigo, sigla: p?.sigla ?? null, corHex: p?.corHex ?? lista[0]?.corHex ?? null, grupoDescricao: p?.grupoDescricao?.trim() || null, itens: lista }] : [];
  });
  const universais = itens.filter((i) => i.universal);
  const outros = itens.filter((i) => !i.universal && !(i.grupoCodigo?.trim()));
  return [...grupos, ...(universais.length ? [{ tipo: "universal" as const, grupoCodigo: null, sigla: null, corHex: null, grupoDescricao: null, itens: universais }] : []), ...(outros.length ? [{ tipo: "outro" as const, grupoCodigo: null, sigla: null, corHex: null, grupoDescricao: null, itens: outros }] : [])];
}

function montarVisao(viagem: ConciliacaoViagemDTO, gruposPaleta: readonly PlacaGrupoPaletaDTO[] = []) {
  const fechada = viagem.viagemFechadaEm != null;
  const porCliente = new Map<string, PedidoConciliacaoDTO[]>();
  for (const pedido of viagem.pedidos) {
    const chave = `${pedido.codCli ?? ""}\u0000${pedido.cliente}`;
    let lista = porCliente.get(chave);
    if (!lista) porCliente.set(chave, (lista = []));
    lista.push(pedido);
  }
  const clientes = [...porCliente.entries()]
    .map(([chaveCliente, lista]) => ({ chaveCliente, pedidos: lista.slice().sort(compareOrdemEntrega) }))
    .sort((a, b) => compareOrdemEntrega(a.pedidos[0], b.pedidos[0]))
    .map(({ chaveCliente, pedidos }) => {
      const nums = new Set(pedidos.map((p) => p.numPed));
      const noCliente = (d: "FICOU" | "TROCA") => viagem.itens.filter((i) => i.destino === d && i.numPed != null && nums.has(i.numPed)).length;
      return {
        chaveCliente, codCli: pedidos[0].codCli, cliente: pedidos[0].cliente, ficou: noCliente("FICOU"), troca: noCliente("TROCA"),
        subBlocos: pedidos.map((p) => ({
          numPed: p.numPed, incluso: p.incluso, quantidadeEsperada: p.quantidadeEsperada, vendedor: p.vendedor,
          secoes: agruparPorSecao(viagem.itens.filter((i) => (apontaPedido(i) && i.numPed === p.numPed) || (!fechada && !temDestino(i) && ehCompativel(i, p.gruposCodigo))), gruposPaleta),
        })),
      };
    });
  return { clientes, retornaram: viagem.itens.filter((item) => item.destino === "RETORNOU") };
}

export type BlocoClienteConciliacao = ReturnType<typeof montarVisao>["clientes"][number];
export type SecaoConciliacao = BlocoClienteConciliacao["subBlocos"][number]["secoes"][number];

function alternarDestino(
  itens: readonly ConciliacaoViagemItemDTO[], pedidos: readonly PedidoConciliacaoDTO[],
  alocacaoIbcId: string, destino: DestinoConciliacao, numPed: string | null,
): ConciliacaoViagemItemDTO[] {
  const pedido = numPed == null ? undefined : pedidos.find((atual) => atual.numPed === numPed);
  const semPedido = { numPed: null, codCli: null, cliente: "", modalidade: null };
  return itens.map((item) => {
    if (item.alocacaoIbcId !== alocacaoIbcId) return item;
    const mesma = destino === "RETORNOU" ? item.destino === "RETORNOU" : item.destino === destino && item.numPed === numPed;
    if (mesma) return { ...item, destino: null, ...semPedido };
    if (destino === "RETORNOU") return { ...item, destino: "RETORNOU", ...semPedido };
    return { ...item, destino, numPed, codCli: pedido?.codCli ?? null, cliente: pedido?.cliente ?? "", modalidade: null };
  });
}

function rotuloVendedores(nomes: readonly (string | null | undefined)[]): string | null {
  const distintos: string[] = [];
  for (const nome of nomes) {
    const limpo = nome?.trim() ?? "";
    if (limpo.length === 0 || distintos.includes(limpo)) continue;
    distintos.push(limpo);
  }
  return distintos.length === 0 ? null : distintos.join(" · ");
}

function lerChegaramAMais(texto: string): { ok: true; valor: number } | { ok: false } {
  const limpo = texto.trim();
  if (limpo === "") return { ok: true, valor: 0 };
  if (!/^\d+$/.test(limpo)) return { ok: false };
  const valor = Number(limpo);
  return Number.isSafeInteger(valor) ? { ok: true, valor } : { ok: false };
}

export const conciliacaoVolta = {
  barras,
  divergentes,
  confirmacoes,
  temDestino,
  chip,
  montarVisao,
  rotuloVendedores,
  alternarDestino,
  lerChegaramAMais,
};
