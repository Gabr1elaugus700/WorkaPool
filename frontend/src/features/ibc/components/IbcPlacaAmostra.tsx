import { cn } from "@/lib/utils";
import { ibcPlacaCadastro } from "../utils/ibcPlacaCadastro";

export default function IbcPlacaAmostra({ corHex }: { corHex?: string | null }) {
  const cor = ibcPlacaCadastro.cor(corHex);
  return (
    <span
      className={cn("inline-block h-5 w-7 shrink-0 rounded-sm border border-border shadow-sm", cor ? "" : "bg-muted")}
      style={cor ? { backgroundColor: cor } : undefined}
      role="img"
      aria-label={cor ? `Placa ${cor}` : "Placa neutra"}
    />
  );
}
