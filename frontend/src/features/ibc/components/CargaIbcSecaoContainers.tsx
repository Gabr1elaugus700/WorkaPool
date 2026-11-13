import type { ContainerPaletaDTO } from "../types/ibcExpedicao.types";
import { containersCarga, type SecaoContainersCarga } from "../utils/containersCarga";
import IbcContainerChip, { type EstadoChipContainer } from "./IbcContainerChip";
import IbcPlacaAmostra from "./IbcPlacaAmostra";

type Props = {
  secao: SecaoContainersCarga;
  estado: EstadoChipContainer;
  desabilitado?: boolean;
  motivoBloqueio?: string;
  limite?: number;
  onSelect?: (container: ContainerPaletaDTO) => void;
};

function rotuloContagem(total: number): string {
  return total === 1 ? "1 disponível" : `${total} disponíveis`;
}

function rotuloGrupo(secao: SecaoContainersCarga): string {
  const base = `${secao.grupoCodigo} · ${secao.sigla}`;
  return secao.grupoDescricao ? `${base} ${secao.grupoDescricao}` : base;
}

function cabecalho(secao: SecaoContainersCarga) {
  const contagem = <span className="text-muted-foreground">{rotuloContagem(secao.containers.length)}</span>;
  if (secao.tipo === "universal") {
    return (
      <h3 className="flex items-center gap-2 text-sm font-medium text-foreground">
        <IbcPlacaAmostra className="h-4 w-4" />
        <span>Universal</span>
        {contagem}
      </h3>
    );
  }
  if (secao.tipo === "nao-homologado") {
    return (
      <h3 className="flex items-center gap-2 text-sm font-medium text-foreground">
        <span>Não homologados</span>
        {contagem}
      </h3>
    );
  }
  return (
    <h3 className="flex items-center gap-2 text-sm font-medium text-foreground">
      <IbcPlacaAmostra className="h-4 w-4" corHex={secao.corHex} />
      <span>{rotuloGrupo(secao)}</span>
      {contagem}
    </h3>
  );
}

export default function CargaIbcSecaoContainers({
  secao,
  estado,
  desabilitado = false,
  motivoBloqueio,
  limite,
  onSelect,
}: Props) {
  const visiveis = limite == null
    ? secao.containers
    : containersCarga.limitarVisiveis(secao.containers, limite).visiveis;
  return (
    <section className="space-y-2">
      {cabecalho(secao)}
      <ul className="flex flex-wrap gap-2">
        {visiveis.map((container) => (
          <li key={container.identificador}>
            <IbcContainerChip
              container={container}
              estado={estado}
              desabilitado={desabilitado}
              motivoBloqueio={motivoBloqueio}
              onSelect={onSelect ? () => onSelect(container) : undefined}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
