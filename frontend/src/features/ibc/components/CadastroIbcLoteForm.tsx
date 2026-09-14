import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CreateLoteIbcInput } from "../types/ibcCadastro.types";

type Props = {
  disabled?: boolean;
  submitting?: boolean;
  onSubmit: (input: CreateLoteIbcInput) => Promise<void> | void;
};

/** YYYY-MM-DD in the user's local calendar (date-only, no time drift). */
function todayLocalIsoDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function CadastroIbcLoteForm({
  disabled = false,
  submitting = false,
  onSubmit,
}: Props) {
  const [quantidade, setQuantidade] = useState("1");
  const [dataLimite, setDataLimite] = useState("");
  const [numeroNf, setNumeroNf] = useState("");
  const minDate = todayLocalIsoDate();
  const quantidadeNum = Number(quantidade);
  const isPastDate = Boolean(dataLimite && dataLimite < minDate);
  const isInvalidN =
    !Number.isInteger(quantidadeNum) ||
    quantidadeNum < 1 ||
    quantidadeNum > 200;
  const canSubmit =
    Boolean(dataLimite) &&
    !isPastDate &&
    !isInvalidN &&
    !disabled &&
    !submitting;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    try {
      await onSubmit({
        quantidade: quantidadeNum,
        dataLimite,
        numeroNf: numeroNf.trim() || null,
      });
      setQuantidade("1");
      setDataLimite("");
      setNumeroNf("");
    } catch {
      // Erro de API: toast no caller; mantém o formulário.
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="ibc-lote-quantidade" className="text-xs">
            Quantidade (N)
          </Label>
          <Input
            id="ibc-lote-quantidade"
            type="number"
            name="quantidade"
            min={1}
            max={200}
            step={1}
            value={quantidade}
            onChange={(e) => setQuantidade(e.target.value)}
            disabled={disabled || submitting}
            required
            aria-invalid={isInvalidN}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ibc-lote-data-limite" className="text-xs">
            Data limite de uso
          </Label>
          <Input
            id="ibc-lote-data-limite"
            type="date"
            name="dataLimite"
            value={dataLimite}
            min={minDate}
            onChange={(e) => setDataLimite(e.target.value)}
            disabled={disabled || submitting}
            required
            aria-invalid={isPastDate}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ibc-lote-nf" className="text-xs">
            NF (opcional)
          </Label>
          <Input
            id="ibc-lote-nf"
            type="text"
            name="numeroNf"
            value={numeroNf}
            onChange={(e) => setNumeroNf(e.target.value)}
            disabled={disabled || submitting}
            placeholder="Número da NF"
          />
        </div>
      </div>
      {isPastDate ? (
        <p className="text-xs text-destructive">
          A data limite não pode ser anterior a hoje.
        </p>
      ) : null}
      {isInvalidN ? (
        <p className="text-xs text-destructive">
          Informe um N inteiro entre 1 e 200.
        </p>
      ) : null}
      <div>
        <Button type="submit" disabled={!canSubmit}>
          {submitting ? "Cadastrando lote…" : "Cadastrar lote"}
        </Button>
      </div>
    </form>
  );
}
