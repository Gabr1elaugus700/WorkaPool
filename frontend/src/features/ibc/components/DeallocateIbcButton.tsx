import { Button } from "@/components/ui/button";
import { Unlink } from "lucide-react";

type Props = {
  identificador: string;
  disabled?: boolean;
  loading?: boolean;
  onDeallocate: () => void;
};

/**
 * Ação de desvincular uma AlocacaoIbc antes do fechamento da expedição.
 */
export default function DeallocateIbcButton({
  identificador,
  disabled = false,
  loading = false,
  onDeallocate,
}: Props) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-md border border-border bg-muted/30 px-3 py-2 text-sm">
      <span className="font-mono font-medium text-foreground">
        {identificador}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={disabled || loading}
        onClick={onDeallocate}
        className="text-destructive hover:text-destructive"
      >
        <Unlink className="h-4 w-4" />
        {loading ? "Removendo…" : "Desvincular"}
      </Button>
    </div>
  );
}
