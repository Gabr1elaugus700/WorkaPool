import type { CSSProperties } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { corHexComOpacidade } from "@/utils/corHexComOpacidade";
import type { ContainerPaletaDTO } from "../types/ibcExpedicao.types";
import { ibcPlacaCadastro } from "../utils/ibcPlacaCadastro";

export type EstadoChipContainer = "disponivel" | "vinculado" | "estatico";

const OPACIDADE_FUNDO = 0.18;
const OPACIDADE_BORDA = 0.9;
const OPACIDADE_ETIQUETA = 0.22;

type Props = {
  container: ContainerPaletaDTO;
  estado: EstadoChipContainer;
  desabilitado?: boolean;
  motivoBloqueio?: string;
  onSelect?: () => void;
};

function rotuloAcessivel(
  container: ContainerPaletaDTO,
  estado: EstadoChipContainer,
  desabilitado: boolean,
  motivoBloqueio: string | undefined,
): string {
  const partes = [container.identificador];
  if (estado === "vinculado" || estado === "estatico") partes.push("Vinculado");
  if (!container.homologado) partes.push("Não homologado");
  if (desabilitado && motivoBloqueio) partes.push(motivoBloqueio);
  return partes.join(", ");
}

function estiloDaPlaca(cor: string | null): CSSProperties | undefined {
  if (cor == null) return undefined;
  return {
    backgroundColor: corHexComOpacidade(cor, OPACIDADE_FUNDO),
    borderColor: corHexComOpacidade(cor, OPACIDADE_BORDA),
  };
}

export default function IbcContainerChip({
  container,
  estado,
  desabilitado = false,
  motivoBloqueio,
  onSelect,
}: Props) {
  const cor = ibcPlacaCadastro.cor(container.corHex);
  const vinculado = estado === "vinculado" || estado === "estatico";
  const rotulo = rotuloAcessivel(container, estado, desabilitado, motivoBloqueio);
  const classe = cn(
    "inline-flex max-w-full items-center gap-1.5 rounded-md border px-3 py-1.5 text-left text-sm font-semibold text-foreground",
    container.homologado ? "border-solid" : "border-dashed",
    cor == null && container.homologado ? "border-border bg-muted" : "",
    cor == null && !container.homologado ? "border-border bg-transparent" : "",
  );
  const estilo = estiloDaPlaca(cor);
  const estiloEtiqueta = cor == null ? undefined : { backgroundColor: corHexComOpacidade(cor, OPACIDADE_ETIQUETA) };
  const conteudo = (
    <>
      {vinculado ? <Check aria-hidden className="h-3.5 w-3.5" /> : null}
      <span>{container.identificador}</span>
      {vinculado ? <span className="sr-only">Vinculado</span> : null}
      {!container.homologado ? (
        <span
          className={cn("rounded-sm px-1.5 py-0.5 text-xs font-medium", cor == null ? "bg-muted text-muted-foreground" : "")}
          style={estiloEtiqueta}
        >
          Não homologado
        </span>
      ) : null}
      {desabilitado && motivoBloqueio ? <span className="text-xs">{motivoBloqueio}</span> : null}
    </>
  );

  if (estado === "estatico") {
    return (
      <span className={classe} style={estilo} aria-label={rotulo}>
        {conteudo}
      </span>
    );
  }

  return (
    <button
      type="button"
      className={classe}
      style={estilo}
      disabled={desabilitado}
      aria-disabled={desabilitado || undefined}
      aria-label={rotulo}
      onClick={onSelect}
    >
      {conteudo}
    </button>
  );
}
