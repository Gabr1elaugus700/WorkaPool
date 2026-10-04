import { useState } from "react";
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
  },
  product_change: {
    title: "Mudar produto do IBC",
    action: "Mudar produto",
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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{COPY[modo].title}</DialogTitle>
          <DialogDescription>
            O IBC {ibc.identificador} não é editado: um novo registro é criado
            com novo identificador e o vínculo fica no histórico.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {modo === "product_change" ? (
            <div className="space-y-1.5">
              <Label htmlFor="ibc-mudanca-produto" className="text-xs">
                Novo produto
              </Label>
              <Select
                value={produtoId}
                onValueChange={setProdutoId}
                disabled={submitting}
              >
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

          <dl className="grid grid-cols-2 gap-2 rounded-md border px-3 py-2 text-sm">
            <dt className="text-muted-foreground">Identificador atual</dt>
            <dd className="font-medium">{ibc.identificador}</dd>
            <dt className="text-muted-foreground">Novo prefixo</dt>
            <dd className="font-medium">
              {prefixoDestino ?? (modo === "conversion" ? "Não aplicável" : "—")}
            </dd>
          </dl>

          <div className="space-y-1.5">
            <Label htmlFor="ibc-mudanca-observacao" className="text-xs">
              Observação (opcional)
            </Label>
            <textarea
              id="ibc-mudanca-observacao"
              value={observacao}
              onChange={(event) => setObservacao(event.target.value)}
              maxLength={IBC_OBSERVACAO_MAX}
              rows={3}
              disabled={submitting}
              placeholder="Ex.: avaria visual encontrada na inspeção"
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <p className="text-right text-xs text-muted-foreground">
              {observacao.length}/{IBC_OBSERVACAO_MAX}
            </p>
          </div>

          <div className="flex items-start gap-2">
            <Checkbox
              id="ibc-mudanca-confirmado"
              checked={confirmado}
              onCheckedChange={(checked) => setConfirmado(checked === true)}
              disabled={submitting}
            />
            <Label htmlFor="ibc-mudanca-confirmado" className="text-sm leading-snug">
              Confirmo a criação do novo registro e o vínculo com {ibc.identificador}.
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button onClick={() => void handleConfirm()} disabled={!canSubmit}>
            {COPY[modo].action}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
