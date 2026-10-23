import { useState, type FormEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SheetBody, SheetFooter } from "@/components/ui/sheet";
import { todayLocalIsoDate } from "@/utils/formatDate";
import type { CreateLoteIbcInput } from "../types/ibcCadastro.types";
import { ibcPlacaCadastro, type GrupoPlacaOpcao } from "../utils/ibcPlacaCadastro";
import CadastroIbcPlacaFields from "./CadastroIbcPlacaFields";

const QUANTIDADE_MAX = 200;

type Props = {
  disabled?: boolean;
  submitting?: boolean;
  grupos: readonly GrupoPlacaOpcao[];
  universalCorHex: string | null;
  notice?: ReactNode;
  onSubmit: (input: CreateLoteIbcInput) => Promise<void> | void;
};

export default function CadastroIbcLoteForm({
  disabled = false,
  submitting = false,
  grupos,
  universalCorHex,
  notice,
  onSubmit,
}: Props) {
  const [quantidade, setQuantidade] = useState("1");
  const [dataLimite, setDataLimite] = useState("");
  const [numeroNf, setNumeroNf] = useState("");
  const [homologado, setHomologado] = useState(true);
  const [grupoCodigo, setGrupoCodigo] = useState("");
  const minDate = todayLocalIsoDate();
  const quantidadeNum = Number(quantidade);
  const isPastDate = Boolean(dataLimite && dataLimite < minDate);
  const isInvalidN =
    !Number.isInteger(quantidadeNum) || quantidadeNum < 1 || quantidadeNum > QUANTIDADE_MAX;
  const placaPronta = ibcPlacaCadastro.aviso(homologado, grupoCodigo, grupos, universalCorHex) == null;
  const canSubmit =
    Boolean(dataLimite) &&
    placaPronta &&
    !isPastDate &&
    !isInvalidN &&
    !disabled &&
    !submitting;
  const fieldDisabled = disabled || submitting;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    try {
      await onSubmit({
        quantidade: quantidadeNum,
        dataLimite,
        numeroNf: numeroNf.trim() || null,
        homologado,
        grupoCodigo: grupoCodigo || null,
      });
      setQuantidade("1");
      setDataLimite("");
      setNumeroNf("");
      setHomologado(true);
      setGrupoCodigo("");
    } catch {
      // Erro de API: toast no caller; mantém o formulário.
    }
  };

  return (
    <form onSubmit={handleSubmit} className="contents">
      <SheetBody className="space-y-4">
        {notice}
        <CadastroIbcPlacaFields
          id="ibc-lote-grupo"
          grupos={grupos}
          universalCorHex={universalCorHex}
          homologado={homologado}
          grupoCodigo={grupoCodigo}
          disabled={fieldDisabled}
          onHomologado={setHomologado}
          onGrupo={setGrupoCodigo}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="ibc-lote-quantidade" className="text-xs">
              Quantidade
            </Label>
            <Input
              id="ibc-lote-quantidade"
              type="number"
              name="quantidade"
              min={1}
              max={QUANTIDADE_MAX}
              step={1}
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value)}
              disabled={fieldDisabled}
              required
              aria-invalid={isInvalidN}
              aria-describedby="ibc-lote-quantidade-hint"
              className="tabular-nums"
            />
            <p
              id="ibc-lote-quantidade-hint"
              className={isInvalidN ? "text-xs text-destructive" : "text-xs text-muted-foreground"}
            >
              {isInvalidN ? `Informe um número inteiro de 1 a ${QUANTIDADE_MAX}.` : `De 1 a ${QUANTIDADE_MAX} IBCs.`}
            </p>
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
              disabled={fieldDisabled}
              required
              aria-invalid={isPastDate}
              aria-describedby={isPastDate ? "ibc-lote-data-limite-hint" : undefined}
            />
            {isPastDate ? (
              <p id="ibc-lote-data-limite-hint" className="text-xs text-destructive">
                A data limite não pode ser anterior a hoje.
              </p>
            ) : null}
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ibc-lote-nf" className="text-xs">
            NF de compra (opcional)
          </Label>
          <Input
            id="ibc-lote-nf"
            type="text"
            name="numeroNf"
            value={numeroNf}
            onChange={(e) => setNumeroNf(e.target.value)}
            disabled={fieldDisabled}
            placeholder="Número da NF"
            className="sm:max-w-[12rem]"
          />
        </div>
      </SheetBody>
      <SheetFooter>
        <Button type="submit" disabled={!canSubmit}>
          {submitting
            ? "Cadastrando lote…"
            : isInvalidN
              ? "Cadastrar lote"
              : `Cadastrar ${quantidadeNum} ${quantidadeNum === 1 ? "IBC" : "IBCs"}`}
        </Button>
      </SheetFooter>
    </form>
  );
}
