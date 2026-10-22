import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useIbcProdutoMutations } from "../hooks/useIbcCadastro";
import type { IbcProdutoListItemDTO } from "../types/ibcCadastro.types";

type Props = {
  open: boolean;
  produtos: IbcProdutoListItemDTO[];
  onOpenChange: (open: boolean) => void;
};

export default function IbcProdutosDrawer({ open, produtos, onOpenChange }: Props) {
  const mutations = useIbcProdutoMutations();
  const [nome, setNome] = useState("");
  const [abreviacao, setAbreviacao] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const editing = produtos.find((produto) => produto.id === editingId);
  const siglaBloqueada = Boolean(editing?.possuiIbcs);
  const busy = mutations.isPending;
  const sigla = abreviacao.trim();
  const canSubmit = nome.trim().length > 0 && sigla.length >= 1 && sigla.length <= 2 && !busy;

  const resetForm = () => {
    setNome("");
    setAbreviacao("");
    setEditingId(null);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    const payload = { nome: nome.trim(), abreviacao: sigla.toUpperCase() };
    try {
      if (editingId) await mutations.atualizar(editingId, payload);
      else await mutations.criar(payload);
      resetForm();
    } catch {
      // Erro de API: toast no hook; mantém o formulário.
    }
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) resetForm();
        onOpenChange(next);
      }}
    >
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Produtos</SheetTitle>
          <SheetDescription>A letra do produto compõe o identificador do IBC (HM + letra).</SheetDescription>
        </SheetHeader>
        <SheetBody className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-3" aria-labelledby="ibc-produto-form-titulo">
            <h3 id="ibc-produto-form-titulo" className="text-sm font-semibold text-foreground">
              {editing ? `Editar ${editing.nome}` : "Novo produto"}
            </h3>
            <div className="grid gap-3 sm:grid-cols-[1fr_7rem]">
              <div className="space-y-1.5">
                <Label htmlFor="produto-nome" className="text-xs">
                  Nome
                </Label>
                <Input
                  id="produto-nome"
                  value={nome}
                  onChange={(event) => setNome(event.target.value)}
                  placeholder="Ex.: Soda"
                  disabled={busy}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="produto-abreviacao" className="text-xs">
                  Letra (1–2)
                </Label>
                <Input
                  id="produto-abreviacao"
                  value={abreviacao}
                  onChange={(event) => setAbreviacao(event.target.value.toUpperCase())}
                  placeholder="Ex.: S"
                  maxLength={2}
                  disabled={busy || siglaBloqueada}
                  aria-describedby={siglaBloqueada ? "produto-abreviacao-bloqueada" : undefined}
                  className="font-medium uppercase tabular-nums placeholder:font-normal placeholder:normal-case"
                />
              </div>
            </div>
            {siglaBloqueada ? (
              <p id="produto-abreviacao-bloqueada" className="text-xs text-muted-foreground">
                Letra bloqueada: este produto já tem containers. Para usar outra letra, cadastre um novo produto e use
                Mudar produto no IBC.
              </p>
            ) : null}
            <div className="flex gap-2">
              <Button type="submit" disabled={!canSubmit}>
                {editing ? "Salvar alterações" : "Cadastrar produto"}
              </Button>
              {editing ? (
                <Button type="button" variant="outline" onClick={resetForm} disabled={busy}>
                  Cancelar edição
                </Button>
              ) : null}
            </div>
          </form>

          <section className="space-y-2" aria-labelledby="ibc-produtos-lista-titulo">
            <h3 id="ibc-produtos-lista-titulo" className="text-sm font-semibold text-foreground">
              Cadastrados <span className="font-normal tabular-nums text-muted-foreground">({produtos.length})</span>
            </h3>
            {produtos.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum produto cadastrado.</p>
            ) : (
              <ul className="divide-y divide-border rounded-md border">
                {produtos.map((produto) => (
                  <li
                    key={produto.id}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2",
                      produto.id === editingId && "bg-muted/60",
                    )}
                  >
                    <span className="flex h-7 w-8 shrink-0 items-center justify-center rounded border bg-card text-xs font-semibold tabular-nums">
                      {produto.abreviacao}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm">{produto.nome}</span>
                    {produto.possuiIbcs ? (
                      <span className="shrink-0 text-xs text-muted-foreground">Com IBCs</span>
                    ) : null}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={busy}
                      aria-label={`Editar ${produto.nome}`}
                      onClick={() => {
                        setEditingId(produto.id);
                        setNome(produto.nome);
                        setAbreviacao(produto.abreviacao);
                      }}
                    >
                      Editar
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
