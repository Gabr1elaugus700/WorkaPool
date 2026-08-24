import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

type Props = {
  podeFechar: boolean;
  loading?: boolean;
  onFechar: () => void;
};

/**
 * Fecha a expedição IBC — só renderiza ação quando preconditions estão ok.
 */
export default function FecharExpedicaoButton({
  podeFechar,
  loading = false,
  onFechar,
}: Props) {
  if (!podeFechar) {
    return null;
  }

  return (
    <Button
      type="button"
      onClick={onFechar}
      disabled={loading}
      className="gap-2"
    >
      <CheckCircle2 className="h-4 w-4" />
      {loading ? "Fechando…" : "Fechar expedição"}
    </Button>
  );
}
