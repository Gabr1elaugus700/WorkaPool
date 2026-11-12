import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ContainerPaletaDTO } from "../types/ibcExpedicao.types";
import { ibcPlacaCadastro } from "../utils/ibcPlacaCadastro";

export type EstadoChipContainer = "disponivel" | "vinculado" | "estatico";

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

export default function IbcContainerChip({
  container,
  estado,
  desabilitado = false,
  motivoBloqueio,
  onSelect,
}: Props) {
  const cor = ibcPlacaCadastro.cor(container.corHex);
  const rotulo = rotuloAcessivel(container, estado, desabilitado, motivoBloqueio);
  const classe = cn(
    "inline-flex max-w-full items-center gap-1.5 rounded-md border border-border px-2 py-1 text-left text-sm font-medium text-foreground",
    estado === "disponivel" && "opacity-50",
    cor ? "" : "bg-muted",
  );
  const estilo = cor ? { backgroundColor: cor } : undefined;
  const conteudo = (
    <>
      <span className="rounded bg-background/90 px-1">{container.identificador}</span>
      {estado === "vinculado" ? (
        <span className="inline-flex items-center gap-1">
          <Check aria-hidden className="h-3.5 w-3.5" />
          <span className="sr-only">Vinculado</span>
        </span>
      ) : null}
      {!container.homologado ? <span className="text-xs">Não homologado</span> : null}
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
