import type { ContainerPaletaDTO } from "../types/ibcExpedicao.types";
import type { SecaoContainersCarga } from "../utils/containersCarga";
import IbcContainerChip, { type EstadoChipContainer } from "./IbcContainerChip";
import IbcPlacaAmostra from "./IbcPlacaAmostra";

type Props = {
  secao: SecaoContainersCarga;
  estado: EstadoChipContainer;
  desabilitado?: boolean;
  motivoBloqueio?: string;
  onSelect?: (container: ContainerPaletaDTO) => void;
};

function cabecalho(secao: SecaoContainersCarga) {
  if (secao.tipo === "universal") {
    return <h3 className="text-sm font-medium text-foreground">Universal</h3>;
  }
  if (secao.tipo === "nao-homologado") {
    return (
      <div>
        <h3 className="text-sm font-medium text-foreground">Não homologados</h3>
        <p className="text-xs text-muted-foreground">Prefixo NH: ainda sem homologação de produto.</p>
      </div>
    );
  }
  return (
    <h3 className="flex items-center gap-2 text-sm font-medium text-foreground">
      <IbcPlacaAmostra corHex={secao.corHex} />
      <span>
        {secao.grupoCodigo} · {secao.sigla}
      </span>
      <span className="text-muted-foreground">{secao.containers.length}</span>
    </h3>
  );
}

export default function CargaIbcSecaoContainers({
  secao,
  estado,
  desabilitado = false,
  motivoBloqueio,
  onSelect,
}: Props) {
  return (
    <section className="space-y-2">
      {cabecalho(secao)}
      <ul className="flex flex-wrap gap-2">
        {secao.containers.map((container) => {
          const visual = secao.tipo === "universal" ? { ...container, corHex: null } : container;
          return (
            <li key={container.identificador}>
              <IbcContainerChip
                container={visual}
                estado={estado}
                desabilitado={desabilitado}
                motivoBloqueio={motivoBloqueio}
                onSelect={onSelect ? () => onSelect(container) : undefined}
              />
            </li>
          );
        })}
      </ul>
    </section>
  );
}
