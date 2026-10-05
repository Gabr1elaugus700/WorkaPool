import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { IbcProdutoListItemDTO } from "../types/ibcCadastro.types";

type ProdutoForm = {
  nome: string;
  abreviacao: string;
};

type Props = {
  produtos: IbcProdutoListItemDTO[];
  disabled?: boolean;
  onCreate: (input: ProdutoForm) => Promise<void>;
  onUpdate: (id: string, input: ProdutoForm) => Promise<void>;
};

export default function CadastroProdutoModal({
  produtos,
  disabled = false,
  onCreate,
  onUpdate,
}: Props) {
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState("");
  const [abreviacao, setAbreviacao] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setNome("");
    setAbreviacao("");
    setEditingId(null);
  };

  const editingProduto = produtos.find((produto) => produto.id === editingId);
  const siglaBloqueada = Boolean(editingProduto?.possuiIbcs);

  const canSubmit =
    nome.trim().length > 0 &&
    abreviacao.trim().length >= 1 &&
    abreviacao.trim().length <= 2 &&
    !disabled &&
    !isSubmitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    try {
      const payload = {
        nome: nome.trim(),
        abreviacao: abreviacao.trim().toUpperCase(),
      };
      if (editingId) {
        await onUpdate(editingId, payload);
      } else {
        await onCreate(payload);
      }
      resetForm();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" disabled={disabled}>
          Cadastrar produto
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Produtos para Container</DialogTitle>
          <DialogDescription>
            Cadastre e edite produtos para compor o identificador do IBC.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="produto-nome" className="text-xs">
              Nome do produto
            </Label>
            <Input
              id="produto-nome"
              value={nome}
              onChange={(event) => setNome(event.target.value)}
              placeholder="Ex.: Soda"
              disabled={disabled || isSubmitting}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="produto-abreviacao" className="text-xs">
              Letra de identificação (1-2)
            </Label>
            <Input
              id="produto-abreviacao"
              value={abreviacao}
              onChange={(event) => setAbreviacao(event.target.value.toUpperCase())}
              placeholder="Ex.: S"
              maxLength={2}
              disabled={disabled || isSubmitting || siglaBloqueada}
              aria-describedby={siglaBloqueada ? "produto-abreviacao-bloqueada" : undefined}
            />
            {siglaBloqueada ? (
              <p id="produto-abreviacao-bloqueada" className="text-xs text-muted-foreground">
                Sigla bloqueada: este produto já tem containers. Para usar outra sigla,
                cadastre um novo produto e use a mudança de produto.
              </p>
            ) : null}
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => void handleSubmit()} disabled={!canSubmit}>
            {editingId ? "Salvar edição" : "Salvar produto"}
          </Button>
          {editingId ? (
            <Button
              variant="outline"
              onClick={resetForm}
              disabled={disabled || isSubmitting}
            >
              Cancelar edição
            </Button>
          ) : null}
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Produtos cadastrados</p>
          <div className="max-h-52 space-y-2 overflow-auto rounded-md border p-2">
            {produtos.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum produto cadastrado.</p>
            ) : (
              produtos.map((produto) => (
                <div
                  key={produto.id}
                  className="flex items-center justify-between rounded border px-2 py-1.5"
                >
                  <span className="text-sm">
                    {produto.nome} ({produto.abreviacao})
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingId(produto.id);
                      setNome(produto.nome);
                      setAbreviacao(produto.abreviacao);
                    }}
                    disabled={disabled || isSubmitting}
                  >
                    Editar
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
