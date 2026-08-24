import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  inputId?: string;
  disabled?: boolean;
  submitting?: boolean;
  onSubmit: (identificador: string) => Promise<void> | void;
};

/**
 * Entrada manual do identificador IBC (sem scanner QR nesta fatia).
 */
export default function AllocateIbcForm({
  inputId = "ibc-identificador",
  disabled = false,
  submitting = false,
  onSubmit,
}: Props) {
  const [identificador, setIdentificador] = useState("");

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = identificador.trim();
    if (!trimmed || disabled || submitting) return;
    await onSubmit(trimmed);
    setIdentificador("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-2 sm:flex-row sm:items-end"
    >
      <div className="flex-1 space-y-1.5">
        <Label htmlFor={inputId} className="text-xs">
          Identificador IBC
        </Label>
        <Input
          id={inputId}
          name="identificador"
          value={identificador}
          onChange={(e) => setIdentificador(e.target.value)}
          placeholder="Ex.: H0045"
          disabled={disabled || submitting}
          autoComplete="off"
        />
      </div>
      <Button
        type="submit"
        size="sm"
        disabled={disabled || submitting || !identificador.trim()}
      >
        {submitting ? "Vinculando…" : "Vincular"}
      </Button>
    </form>
  );
}
