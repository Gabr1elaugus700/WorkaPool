import { useState, type FormEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SheetBody, SheetFooter } from "@/components/ui/sheet";
import { todayLocalIsoDate } from "@/utils/formatDate";
import type { CreateNovoIbcInput } from "../types/ibcCadastro.types";
import { ibcPlacaCadastro, type GrupoPlacaOpcao } from "../utils/ibcPlacaCadastro";
import CadastroIbcPlacaFields from "./CadastroIbcPlacaFields";

type Props = {
  disabled?: boolean;
  submitting?: boolean;
  grupos: readonly GrupoPlacaOpcao[];
  universalCorHex: string | null;
  notice?: ReactNode;
  onSubmit: (payload: CreateNovoIbcInput) => Promise<void> | void;
};

export default function CadastroIbcForm({
  disabled = false,
  submitting = false,
  grupos,
  universalCorHex,
  notice,
  onSubmit,
}: Props) {
  const [dataLimite, setDataLimite] = useState("");
  const [homologado, setHomologado] = useState(true);
  const [grupoCodigo, setGrupoCodigo] = useState("");
  const minDate = todayLocalIsoDate();
  const isPastDate = Boolean(dataLimite && dataLimite < minDate);
  const placaPronta = ibcPlacaCadastro.aviso(homologado, grupoCodigo, grupos, universalCorHex) == null;
  const canSubmit = Boolean(dataLimite) && placaPronta && !isPastDate && !disabled && !submitting;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    try {
      await onSubmit({ dataLimite, homologado, grupoCodigo: grupoCodigo || null });
      setDataLimite("");
      setHomologado(true);
      setGrupoCodigo("");
    } catch {
      // Erro de API: toast no caller; mantém a data preenchida.
    }
  };

  return (
    <form onSubmit={handleSubmit} className="contents">
      <SheetBody className="space-y-4">
        {notice}
        <CadastroIbcPlacaFields
          id="ibc-grupo"
          grupos={grupos}
          universalCorHex={universalCorHex}
          homologado={homologado}
          grupoCodigo={grupoCodigo}
          disabled={disabled || submitting}
          onHomologado={setHomologado}
          onGrupo={setGrupoCodigo}
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
