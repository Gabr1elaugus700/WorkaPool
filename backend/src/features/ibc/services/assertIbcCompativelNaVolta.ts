import { AppError } from "../../../utils/AppError";
import {
  carregarCompatibilidadeDePedidos,
  GruposConfiguradosLookup,
  PedidoParaCompatibilidade,
} from "./carregarCompatibilidadeDePedidos";
import { createGruposConfiguradosLookup } from "./createGruposConfiguradosLookup";
import { IbcCompatibilidade, isIbcCompativelComGrupos } from "./isIbcCompativelComGrupos";

type MarcaVolta = {
  alocacaoIbcId: string;
  destino: "FICOU" | "RETORNOU" | "TROCA";
  numPed: string | null;
};

type AlocacaoVolta = { id: string; ibcId: string; identificador: string };

type IbcNaVolta = IbcCompatibilidade & { id: string };

/**
 * Ficou e troca usam os grupos do pedido apontado (grupo sem configuração sai do conjunto).
 * Retornou não tem pedido e não é checado.
 */
export async function assertIbcCompativelNaVolta(input: {
  alocacoes: readonly AlocacaoVolta[];
  marcas: readonly MarcaVolta[];
  pedidos: readonly PedidoParaCompatibilidade[];
  carregarIbcs: (ids: readonly string[]) => Promise<readonly IbcNaVolta[]>;
  lookup?: GruposConfiguradosLookup;
}): Promise<void> {
  const alocacoes = new Map(input.alocacoes.map((alocacao) => [alocacao.id, alocacao]));
  const noCliente = input.marcas.flatMap((marca) => {
    if (marca.destino === "RETORNOU" || marca.numPed == null) return [];
    const alocacao = alocacoes.get(marca.alocacaoIbcId);
    return alocacao ? [{ alocacao, numPed: marca.numPed }] : [];
  });
  if (noCliente.length === 0) return;

  const pedidos = new Map(input.pedidos.map((pedido) => [pedido.numPed, pedido]));
  const ibcs = new Map(
    (await input.carregarIbcs([...new Set(noCliente.map((item) => item.alocacao.ibcId))])).map((ibc) => [ibc.id, ibc]),
  );
  const lookup = memoriaDeGrupos(
    input.lookup,
    noCliente.flatMap((item) => pedidos.get(item.numPed)?.gruposCodigo ?? []),
  );
  const permitidos = new Map<string, string[]>();

  for (const item of noCliente) {
    const pedido = pedidos.get(item.numPed);
    if (!pedido) continue;
    let gruposPermitidos = permitidos.get(pedido.numPed);
    if (!gruposPermitidos) {
      gruposPermitidos = (await carregarCompatibilidadeDePedidos([pedido], lookup)).gruposPermitidos;
      permitidos.set(pedido.numPed, gruposPermitidos);
    }
    const ibc = ibcs.get(item.alocacao.ibcId) ?? {
      id: item.alocacao.ibcId,
      identificador: item.alocacao.identificador,
      universal: false,
      grupoCodigo: null,
    };
    if (isIbcCompativelComGrupos(ibc, gruposPermitidos)) continue;
    throw new AppError({
      message: `IBC ${ibc.identificador} não é compatível com o produto do pedido ${pedido.numPed}`,
      statusCode: 409,
      code: "IBC_PRODUTO_INCOMPATIVEL",
      details: {
        identificador: ibc.identificador,
        grupoContainer: ibc.grupoCodigo,
        gruposPermitidos,
      },
    });
  }
}

function memoriaDeGrupos(
  lookup: GruposConfiguradosLookup | undefined,
  grupos: readonly string[],
): GruposConfiguradosLookup {
  let fonte = lookup;
  let carregado: Promise<ReadonlySet<string>> | null = null;
  return {
    async listGruposConfigurados(_codigos: readonly string[]) {
      carregado ??= (fonte ??= createGruposConfiguradosLookup())
        .listGruposConfigurados(grupos)
        .then((rows) => new Set(rows.map((grupo) => grupo.trim()).filter((grupo) => grupo.length > 0)));
      return [...(await carregado)];
    },
  };
}
