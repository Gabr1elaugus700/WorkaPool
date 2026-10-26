import type { CSSProperties } from "react";
import { Check, Loader2, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ContainerCargaDTO } from "../types/ibcExpedicao.types";
import { containersCarga } from "../utils/containersCarga";
import { ibcPlacaCadastro } from "../utils/ibcPlacaCadastro";

export type IbcContainerChipEstado = "disponivel" | "vinculado" | "estatico";

type Props = {
  container: ContainerCargaDTO;
  estado: IbcContainerChipEstado;
  carregando?: boolean;
  disabled?: boolean;
  onClick?: () => void;
};

function rotulo(container: ContainerCargaDTO, estado: IbcContainerChipEstado): string {
  const grupo = containersCarga.rotuloGrupo(container);
  if (estado === "disponivel") return `Vincular ${container.identificador} (${grupo})`;
  if (estado === "vinculado") return `Desvincular ${container.identificador} (${grupo})`;
  return `${container.identificador} na carga (${grupo})`;
}

/**
 * Chip estilo placa: amostra na cor do produto + código. Na carga a amostra fica cheia
 * e o fundo tinge; disponível fica desbotado. A borda é neutra: placa clara some no branco.
 */
export default function IbcContainerChip({ container, estado, carregando = false, disabled = false, onClick }: Props) {
  const cor = ibcPlacaCadastro.cor(container.corHex);
  const naCarga = estado !== "disponivel";
  const chipStyle: CSSProperties | undefined = naCarga && cor ? { backgroundColor: `${cor}1F` } : undefined;
  const Icone = carregando ? Loader2 : estado === "vinculado" ? X : estado === "estatico" ? Check : Plus;
  const classes = cn(
    "group inline-flex h-10 items-center gap-2 rounded-md border px-2.5 font-mono text-sm tabular-nums transition-[color,background-color,border-color,opacity] duration-150 ease-out",
    naCarga
      ? "border-foreground/40 bg-card font-medium text-foreground"
      : "border-border bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "disabled:cursor-not-allowed disabled:opacity-50",
  );

  const conteudo = (
    <>
      <span
        aria-hidden
        className={cn(
          "h-4 w-6 shrink-0 rounded-[3px] border border-foreground/15 transition-opacity duration-150",
          cor ? "" : "bg-muted",
          naCarga ? "opacity-100" : "opacity-40 group-hover:opacity-80 group-disabled:opacity-40",
        )}
        style={cor ? { backgroundColor: cor } : undefined}
      />
      <span>{container.identificador}</span>
      <Icone
        aria-hidden
        className={cn(
          "h-3.5 w-3.5 shrink-0",
          carregando && "animate-spin",
          estado === "disponivel" && !carregando && "opacity-40 group-hover:opacity-100 group-focus-visible:opacity-100",
          estado === "vinculado" && !carregando && "text-muted-foreground group-hover:text-destructive",
        )}
      />
    </>
  );

  if (estado === "estatico") {
    return (
      <span className={classes} style={chipStyle} aria-label={rotulo(container, estado)} role="img">
        {conteudo}
      </span>
    );
  }

  return (
    <button
      type="button"
      className={classes}
      style={chipStyle}
      aria-label={rotulo(container, estado)}
      aria-busy={carregando || undefined}
      disabled={disabled || carregando}
      onClick={onClick}
    >
      {conteudo}
    </button>
  );
}
