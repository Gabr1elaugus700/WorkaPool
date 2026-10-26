import { useId } from "react";
import { cn } from "@/lib/utils";
import type { SecaoPaleta } from "../utils/containersCarga";
import IbcContainerChip from "./IbcContainerChip";

type Props = {
  secao: SecaoPaleta;
  /** Total da seção quando `secao.itens` vem cortado. */
  total?: number;
  disabled: boolean;
  pendente: string | null;
  onVincular: (identificador: string) => void;
};

/** Uma seção de disponíveis: cabeçalho com a amostra do grupo e os chips opacos. */
export default function CargaIbcSecaoContainers({ secao, total, disabled, pendente, onVincular }: Props) {
  const tituloId = useId();
  const quantidade = total ?? secao.itens.length;
  return (
    <section aria-labelledby={tituloId} className="space-y-2">
      <h4 id={tituloId} className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <span
          aria-hidden
          className={cn(
            "shrink-0",
            secao.tipo === "naoHomologado"
              ? "h-2 w-2 rounded-full bg-amber-500"
              : "h-2.5 w-3.5 rounded-[2px] border border-foreground/15",
            secao.tipo !== "naoHomologado" && !secao.corHex && "bg-muted",
          )}
          style={secao.tipo !== "naoHomologado" && secao.corHex ? { backgroundColor: secao.corHex } : undefined}
        />
        <span className="text-foreground">{secao.titulo}</span>
        <span className="tabular-nums">
          {quantidade}
          <span className="sr-only"> {quantidade === 1 ? "disponível" : "disponíveis"}</span>
        </span>
      </h4>
      <ul className="flex flex-wrap gap-2">
        {secao.itens.map((container) => (
          <li key={container.ibcId}>
            <IbcContainerChip
              container={container}
              estado="disponivel"
              carregando={pendente === container.identificador}
              disabled={disabled || (pendente != null && pendente !== container.identificador)}
              onClick={() => onVincular(container.identificador)}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
