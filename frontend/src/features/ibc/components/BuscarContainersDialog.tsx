import { useState, type FormEvent, type KeyboardEvent, type ReactNode } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { ContainerCargaDTO } from "../types/ibcExpedicao.types";
import type { SecaoPaleta } from "../utils/containersCarga";
import { containersCarga } from "../utils/containersCarga";
import CargaIbcSecaoContainers from "./CargaIbcSecaoContainers";
import IbcContainerChip from "./IbcContainerChip";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  descricao: string;
  naCarga: readonly ContainerCargaDTO[];
  secoes: readonly SecaoPaleta[];
  /** Por que não dá para vincular agora (teto, sem esperado). Nulo quando pode. */
  motivoBloqueio: string | null;
  pendente: string | null;
  aviso: ReactNode;
  anuncio: string;
  onVincular: (identificador: string) => Promise<boolean>;
};

const INPUT_ID = "ibc-buscar-container";

export default function BuscarContainersDialog({
  open,
  onOpenChange,
  descricao,
  naCarga,
  secoes,
  motivoBloqueio,
  pendente,
  aviso,
  anuncio,
  onVincular,
}: Props) {
  const [termo, setTermo] = useState("");
  const codigo = termo.trim().toUpperCase();
  const filtradas = containersCarga.filtrar(secoes, codigo);
  const naLista = filtradas.some((secao) => secao.itens.some((item) => item.identificador === codigo));
  const bloqueado = motivoBloqueio != null;

  const vincularCodigo = async (event: FormEvent | KeyboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    if (!codigo || naLista || bloqueado || pendente) return;
    if (await onVincular(codigo)) setTermo("");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(aberto) => {
        if (!aberto) setTermo("");
        onOpenChange(aberto);
      }}
    >
      <DialogContent className="flex max-h-[85vh] max-w-2xl flex-col gap-4">
        <DialogHeader>
          <DialogTitle>Buscar containers</DialogTitle>
          <DialogDescription>{descricao}</DialogDescription>
        </DialogHeader>

        <div className="relative">
          <label htmlFor={INPUT_ID} className="sr-only">
            Código do container
          </label>
          <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id={INPUT_ID}
            value={termo}
            onChange={(event) => setTermo(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") void vincularCodigo(event);
            }}
            placeholder="Código do container, ex.: HMAZ0045"
            autoComplete="off"
            autoFocus
            className="pl-9 font-mono"
          />
        </div>

        {motivoBloqueio ? <p className="text-sm font-medium text-foreground">{motivoBloqueio}</p> : null}
        {aviso}
        <p aria-live="polite" className="sr-only">
          {anuncio}
        </p>

        <div className="-mx-1 min-h-0 flex-1 space-y-4 overflow-y-auto px-1 pb-1">
          {naCarga.length > 0 ? (
            <section aria-label="Na carga" className="space-y-2">
              <h4 className="text-xs font-medium text-foreground">Na carga</h4>
              <ul className="flex flex-wrap gap-2">
                {naCarga.map((container) => (
                  <li key={container.ibcId}>
                    <IbcContainerChip container={container} estado="estatico" />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          {filtradas.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {codigo
                ? "Nenhum container livre com esse código. Se ele existe, vincule pelo código: o sistema diz por que não pode, se for o caso."
                : "Nenhum container livre e compatível com esta carga."}
            </p>
          ) : (
            filtradas.map((secao) => (
              <CargaIbcSecaoContainers
                key={secao.chave}
                secao={secao}
                disabled={bloqueado}
                pendente={pendente}
                onVincular={(identificador) => void onVincular(identificador)}
              />
            ))
          )}
        </div>

        <form
          onSubmit={vincularCodigo}
          className="flex flex-wrap items-center justify-end gap-3 border-t border-border pt-4"
        >
          <span className="text-sm text-muted-foreground">Não está na lista?</span>
          <Button type="submit" disabled={!codigo || naLista || bloqueado || pendente != null}>
            {pendente != null && pendente === codigo ? "Vinculando…" : codigo && !naLista ? `Vincular ${codigo}` : "Vincular pelo código"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
