import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  disabled?: boolean;
  submitting?: boolean;
  onSubmit: (dataLimite: string) => Promise<void> | void;
};

export default function CadastroIbcForm({
  disabled = false,
  submitting = false,
  onSubmit,
}: Props) {
  const [dataLimite, setDataLimite] = useState("");

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!dataLimite || disabled || submitting) return;
    await onSubmit(dataLimite);
    setDataLimite("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 sm:flex-row sm:items-end"
    >
      <div className="flex-1 space-y-1.5">
        <Label htmlFor="ibc-data-limite" className="text-xs">
          Data limite de uso
        </Label>
        <Input
          id="ibc-data-limite"
          type="date"
          name="dataLimite"
          value={dataLimite}
          onChange={(e) => setDataLimite(e.target.value)}
          disabled={disabled || submitting}
          required
        />
      </div>
      <Button type="submit" disabled={disabled || submitting || !dataLimite}>
        {submitting ? "Cadastrando…" : "Cadastrar Novo IBC"}
      </Button>
    </form>
  );
}
