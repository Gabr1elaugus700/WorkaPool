import { pedidosNaSomaDaCarga, PedidoSomaCarga } from "./pedidosNaSomaDaCarga";

export type GruposConfiguradosLookup = {
  listGruposConfigurados(grupos: readonly string[]): Promise<readonly string[]>;
};

export type PedidoParaCompatibilidade = PedidoSomaCarga & {
  numPed: string;
  gruposCodigo: readonly string[];
};

export type AvisoPedidoGrupoSemConfig = {
  code: "IBC_PEDIDO_GRUPO_SEM_CONFIG";
  numPed: string;
  gruposCodigo: string[];
  message: string;
};

export type CompatibilidadeDePedidos = {
  gruposPermitidos: string[];
  avisos: AvisoPedidoGrupoSemConfig[];
};

function codigosDistintos(grupos: readonly string[]): string[] {
  const vistos = new Set<string>();
  const lista: string[] = [];
  for (const bruto of grupos) {
    const grupo = bruto.trim();
    if (grupo.length === 0 || vistos.has(grupo)) continue;
    vistos.add(grupo);
    lista.push(grupo);
  }
  return lista;
}

function mensagemAviso(numPed: string, grupos: readonly string[]): string {
  if (grupos.length === 1) {
    return `Pedido ${numPed}: grupo ${grupos[0]} não tem configuração de placa. Só o container universal atende.`;
  }
  return `Pedido ${numPed}: grupos ${grupos.join(", ")} não têm configuração de placa. Só o container universal atende.`;
}

/**
 * Grupos permitidos = união dos grupos dos pedidos elegíveis que têm configuração.
 * Grupo sem configuração sai do conjunto (só o universal atende) e gera um aviso por pedido.
 */
export async function carregarCompatibilidadeDePedidos(
  pedidos: readonly PedidoParaCompatibilidade[],
  lookup: GruposConfiguradosLookup,
): Promise<CompatibilidadeDePedidos> {
  const elegiveis = pedidosNaSomaDaCarga(pedidos);
  const todos = codigosDistintos(elegiveis.flatMap((pedido) => pedido.gruposCodigo));
  const configurados = new Set<string>();
  if (todos.length > 0) {
    for (const grupo of await lookup.listGruposConfigurados(todos)) {
      const codigo = grupo.trim();
      if (codigo.length > 0) configurados.add(codigo);
    }
  }

  const gruposPermitidos: string[] = [];
  const vistos = new Set<string>();
  const avisos: AvisoPedidoGrupoSemConfig[] = [];

  for (const pedido of elegiveis) {
    const semConfig: string[] = [];
    for (const grupo of codigosDistintos(pedido.gruposCodigo)) {
      if (!configurados.has(grupo)) {
        semConfig.push(grupo);
        continue;
      }
      if (vistos.has(grupo)) continue;
      vistos.add(grupo);
      gruposPermitidos.push(grupo);
    }
    if (semConfig.length === 0) continue;
    avisos.push({
      code: "IBC_PEDIDO_GRUPO_SEM_CONFIG",
      numPed: pedido.numPed,
      gruposCodigo: semConfig,
      message: mensagemAviso(pedido.numPed, semConfig),
    });
  }

  return { gruposPermitidos, avisos };
}
