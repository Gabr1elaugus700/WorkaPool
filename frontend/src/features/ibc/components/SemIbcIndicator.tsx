import { Badge } from "@/components/ui/badge";
import { Ban } from "lucide-react";

/**
 * Indicador de carga sem pedidos IBC elegíveis — listada, sem ações.
 */
export default function SemIbcIndicator() {
  return (
    <Badge
      variant="outline"
      className="gap-1 border-amber-500/40 bg-amber-500/10 text-amber-800 text-[10px]"
    >
      <Ban className="h-3 w-3" />
      Sem pedidos IBC
    </Badge>
  );
}
