import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { IbcProdutoDTO } from "../types/ibcCadastro.types";

type Props = {
  disabled?: boolean;
  submitting?: boolean;
  produtos: IbcProdutoDTO[];
  onSubmit: (payload: { dataLimite: string; produtoId: string }) => Promise<void> | void;
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
  produtos,
  onSubmit,
}: Props) {
  const [dataLimite, setDataLimite] = useState("");
  const [produtoId, setProdutoId] = useState("");
  const minDate = todayLocalIsoDate();
  const isPastDate = Boolean(dataLimite && dataLimite < minDate);
  const canSubmit =
    Boolean(dataLimite) &&
    Boolean(produtoId) &&
    !isPastDate &&
    !disabled &&
    !submitting;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    try {
      await onSubmit({ dataLimite, produtoId });
      setDataLimite("");
      setProdutoId("");
    } catch {
      // Erro de API: toast no caller; mantém a data preenchida.
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-1.5">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="min-w-0 space-y-1.5">
          <Label htmlFor="ibc-produto" className="text-xs">
            Produto
          </Label>
          <Select
            value={produtoId}
            onValueChange={setProdutoId}
            disabled={disabled || submitting}
          >
            <SelectTrigger id="ibc-produto">
              <SelectValue placeholder="Selecione um produto" />
            </SelectTrigger>
            <SelectContent>
              {produtos.map((produto) => (
                <SelectItem key={produto.id} value={produto.id}>
                  {produto.nome} ({produto.abreviacao})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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
        <div className="flex items-end">
          <Button type="submit" disabled={!canSubmit}>
            {submitting ? "Cadastrando…" : "Cadastrar Novo IBC"}
          </Button>
        </div>
      </div>
      {isPastDate ? (
        <p id="ibc-data-limite-hint" className="text-xs text-destructive">
          A data limite não pode ser anterior a hoje.
        </p>
      ) : null}
    </form>
  );
}
