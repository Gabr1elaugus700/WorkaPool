import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  inputId?: string;
  disabled?: boolean;
  submitting?: boolean;
  invalid?: boolean;
  describedBy?: string;
  onSubmit: (identificador: string) => Promise<boolean | void> | boolean | void;
};

/**
 * Entrada manual do identificador IBC (sem scanner QR nesta fatia).
 */
export default function AllocateIbcForm({
  inputId = "ibc-identificador",
  disabled = false,
  submitting = false,
  invalid = false,
  describedBy,
  onSubmit,
}: Props) {
  const [identificador, setIdentificador] = useState("");

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = identificador.trim();
    if (!trimmed || disabled || submitting) return;
    const accepted = await onSubmit(trimmed);
    if (accepted === false) return;
    setIdentificador("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-1.5">
      <Label htmlFor={inputId} className="text-xs">
        Identificador IBC
      </Label>
      <div className="flex max-w-md">
        <Input
          id={inputId}
          name="identificador"
          value={identificador}
          onChange={(e) => setIdentificador(e.target.value)}
          placeholder="Ex.: H0045"
          disabled={disabled || submitting}
          autoComplete="off"
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          className={
            invalid
              ? "rounded-r-none border-destructive focus-visible:z-10 focus-visible:ring-destructive"
              : "rounded-r-none focus-visible:z-10"
          }
        />
        <Button
          type="submit"
          variant="outline"
          className="-ml-px rounded-l-none"
          disabled={disabled || submitting || !identificador.trim()}
        >
          {submitting ? "Vinculando…" : "Vincular"}
        </Button>
      </div>
    </form>
  );
}
