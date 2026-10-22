import { useState, type FormEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SheetBody, SheetFooter } from "@/components/ui/sheet";
import { todayLocalIsoDate } from "@/utils/formatDate";
import type { IbcProdutoDTO } from "../types/ibcCadastro.types";
import IbcProdutoSelect from "./IbcProdutoSelect";

type Props = {
  disabled?: boolean;
  submitting?: boolean;
  produtos: IbcProdutoDTO[];
  notice?: ReactNode;
  onSubmit: (payload: { dataLimite: string; produtoId: string }) => Promise<void> | void;
};

export default function CadastroIbcForm({
  disabled = false,
  submitting = false,
  produtos,
  notice,
  onSubmit,
}: Props) {
  const [dataLimite, setDataLimite] = useState("");
  const [produtoId, setProdutoId] = useState("");
  const minDate = todayLocalIsoDate();
  const isPastDate = Boolean(dataLimite && dataLimite < minDate);
  const canSubmit =
    Boolean(dataLimite) && Boolean(produtoId) && !isPastDate && !disabled && !submitting;

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
    <form onSubmit={handleSubmit} className="contents">
      <SheetBody className="space-y-4">
        {notice}
        <IbcProdutoSelect
          id="ibc-produto"
          produtos={produtos}
          value={produtoId}
          disabled={disabled || submitting}
          onChange={setProdutoId}
        />
        <div className="space-y-1.5">
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
            className="sm:max-w-[12rem]"
          />
          {isPastDate ? (
            <p id="ibc-data-limite-hint" className="text-xs text-destructive">
              A data limite não pode ser anterior a hoje.
            </p>
          ) : null}
        </div>
      </SheetBody>
      <SheetFooter>
        <Button type="submit" disabled={!canSubmit}>
          {submitting ? "Cadastrando…" : "Cadastrar IBC"}
        </Button>
      </SheetFooter>
    </form>
  );
}
