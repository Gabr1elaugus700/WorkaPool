import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  disabled?: boolean;
  submitting?: boolean;
  onSubmit: (dataLimite: string) => Promise<void> | void;
};

/** YYYY-MM-DD in the user's local calendar (date-only, no time drift). */
function todayLocalIsoDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function CadastroIbcForm({
  disabled = false,
  submitting = false,
  onSubmit,
}: Props) {
  const [dataLimite, setDataLimite] = useState("");
  const minDate = todayLocalIsoDate();
  const isPastDate = Boolean(dataLimite && dataLimite < minDate);
  const canSubmit = Boolean(dataLimite) && !isPastDate && !disabled && !submitting;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    try {
      await onSubmit(dataLimite);
      setDataLimite("");
    } catch {
      // Erro de API: toast no caller; mantém a data preenchida.
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-1.5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1 space-y-1.5">
          <Label htmlFor="ibc-data-limite" className="text-xs">
            Data limite de uso
          </Label>
          <Input
            id="ibc-data-limite"
            type="date"
            name="dataLimite"
            value={dataLimite}
            min={minDate}
            onChange={(e) => setDataLimite(e.target.value)}
            disabled={disabled || submitting}
            required
            aria-invalid={isPastDate}
            aria-describedby={isPastDate ? "ibc-data-limite-hint" : undefined}
          />
        </div>
        <Button type="submit" disabled={!canSubmit}>
          {submitting ? "Cadastrando…" : "Cadastrar Novo IBC"}
        </Button>
      </div>
      {isPastDate ? (
        <p id="ibc-data-limite-hint" className="text-xs text-destructive">
          A data limite não pode ser anterior a hoje.
        </p>
      ) : null}
    </form>
  );
}
