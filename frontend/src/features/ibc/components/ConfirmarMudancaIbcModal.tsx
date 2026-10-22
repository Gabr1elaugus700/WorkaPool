import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type {
  IbcCadastroDTO,
  IbcMudancaConfirmacaoInput,
  IbcProdutoDTO,
} from "../types/ibcCadastro.types";
import {
  IBC_OBSERVACAO_MAX,
  buildIbcMudancaConfirmacao,
  previewConversaoPrefixo,
  previewMudancaProdutoPrefixo,
} from "../utils/ibcMudanca.utils";

export type IbcMudancaModo = "conversion" | "product_change";

type Props = {
  ibc: IbcCadastroDTO;
  modo: IbcMudancaModo;
  produtos: IbcProdutoDTO[];
  submitting: boolean;
  onClose: () => void;
  onConfirm: (payload: {
    confirmacao: IbcMudancaConfirmacaoInput;
    produtoId: string | null;
  }) => Promise<void>;
};

const COPY = {
  conversion: {
    title: "Converter para não homologado",
    action: "Converter",
    pending: "Convertendo…",
  },
  product_change: {
    title: "Mudar produto do IBC",
    action: "Mudar produto",
    pending: "Mudando produto…",
  },
} as const;

export default function ConfirmarMudancaIbcModal({
  ibc,
  modo,
  produtos,
  submitting,
  onClose,
  onConfirm,
}: Props) {
  const [produtoId, setProdutoId] = useState("");
  const [observacao, setObservacao] = useState("");
  const [confirmado, setConfirmado] = useState(false);

  const produtosDestino = produtos.filter((produto) => produto.id !== ibc.produtoId);
  const produtoDestino = produtosDestino.find((produto) => produto.id === produtoId);
  const prefixoDestino =
    modo === "conversion"
      ? previewConversaoPrefixo(ibc)
      : produtoDestino
        ? previewMudancaProdutoPrefixo(ibc, produtoDestino.abreviacao)
        : null;

  const confirmacao = buildIbcMudancaConfirmacao(confirmado, observacao);
  const canSubmit =
    confirmacao != null &&
    prefixoDestino != null &&
    (modo === "conversion" || produtoDestino != null) &&
    !submitting;

  const handleConfirm = async () => {
    if (!canSubmit || !confirmacao) return;
    await onConfirm({
      confirmacao,
      produtoId: modo === "product_change" ? produtoId : null,
    });
  };

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-w-lg gap-5">
        <DialogHeader>
          <DialogTitle>{COPY[modo].title}</DialogTitle>
          <DialogDescription>
            O IBC {ibc.identificador} não é editado: um novo registro é criado com novo identificador e o vínculo
            fica no histórico.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {modo === "product_change" ? (
            <div className="space-y-1.5">
              <Label htmlFor="ibc-mudanca-produto" className="text-xs">
                Novo produto
              </Label>
              <Select value={produtoId} onValueChange={setProdutoId} disabled={submitting}>
                <SelectTrigger id="ibc-mudanca-produto">
                  <SelectValue placeholder="Selecione o produto de destino" />
                </SelectTrigger>
                <SelectContent>
                  {produtosDestino.map((produto) => (
                    <SelectItem key={produto.id} value={produto.id}>
                      {produto.nome} ({produto.abreviacao})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          <div className="flex items-center gap-3 rounded-md border bg-muted/40 px-3 py-2.5 text-sm">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Identificador atual</p>
              <p className="font-medium tabular-nums">{ibc.identificador}</p>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Novo prefixo</p>
              <p className="font-medium tabular-nums">
                {prefixoDestino ?? (modo === "conversion" ? "Não aplicável" : "Escolha o produto")}
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between">
              <Label htmlFor="ibc-mudanca-observacao" className="text-xs">
                Observação (opcional)
              </Label>
              <span className="text-xs tabular-nums text-muted-foreground">
                {observacao.length}/{IBC_OBSERVACAO_MAX}
              </span>
            </div>
            <Textarea
              id="ibc-mudanca-observacao"
              value={observacao}
              onChange={(event) => setObservacao(event.target.value)}
              maxLength={IBC_OBSERVACAO_MAX}
              rows={3}
              disabled={submitting}
              placeholder="Ex.: avaria visual encontrada na inspeção"
            />
          </div>

          <div className="flex items-start gap-2">
            <Checkbox
              id="ibc-mudanca-confirmado"
              checked={confirmado}
              onCheckedChange={(checked) => setConfirmado(checked === true)}
              disabled={submitting}
              className="mt-0.5"
            />
            <Label htmlFor="ibc-mudanca-confirmado" className="text-sm font-normal leading-snug">
              Confirmo a criação do novo registro e o vínculo com {ibc.identificador}.
            </Label>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:space-x-0">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button onClick={() => void handleConfirm()} disabled={!canSubmit}>
            {submitting ? COPY[modo].pending : COPY[modo].action}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
