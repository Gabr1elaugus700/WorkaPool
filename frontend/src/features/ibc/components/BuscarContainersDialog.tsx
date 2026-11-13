import { useState, type FormEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ContainersCargaDTO } from "../types/ibcExpedicao.types";
import { containersCarga } from "../utils/containersCarga";
import CargaIbcSecaoContainers from "./CargaIbcSecaoContainers";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paleta: ContainersCargaDTO;
  termo: string;
  onTermoChange: (termo: string) => void;
  noTeto: boolean;
  motivoTeto?: string;
  onVincular: (identificador: string) => void;
  onVincularCodigo: (codigo: string) => void;
};

function Busca({
  paleta,
  termo,
  onTermoChange,
  noTeto,
  motivoTeto,
  onVincular,
  onVincularCodigo,
}: Omit<Props, "open" | "onOpenChange">) {
  const [codigo, setCodigo] = useState("");
  const disponiveis = containersCarga.filtrarPorCodigo(paleta.disponiveis, termo);
  const secoes = containersCarga.agruparDisponiveis({ ...paleta, disponiveis });

  function vincularCodigo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const livre = codigo.trim();
    if (livre.length === 0 || noTeto) return;
    onVincularCodigo(livre);
    setCodigo("");
  }

  return (
    <>
      <div className="space-y-1">
        <Label htmlFor="busca-container-codigo">Código</Label>
        <Input
          id="busca-container-codigo"
          value={termo}
          onChange={(event) => onTermoChange(event.target.value)}
          placeholder="Filtrar por código"
        />
      </div>
      {noTeto && motivoTeto ? <p className="text-sm text-foreground">{motivoTeto}</p> : null}
      {secoes.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum container com esse código.</p>
      ) : (
        <div className="space-y-4">
          {secoes.map((secao) => (
            <CargaIbcSecaoContainers
              key={secao.tipo === "grupo" ? secao.grupoCodigo : secao.tipo}
              secao={secao}
              estado="disponivel"
              desabilitado={noTeto}
              motivoBloqueio={noTeto ? motivoTeto : undefined}
              onSelect={(container) => onVincular(container.identificador)}
            />
          ))}
        </div>
      )}
      <form onSubmit={vincularCodigo} className="space-y-2 border-t border-border pt-3">
        <p className="text-sm font-medium text-foreground">Não encontrou? Vincule pelo código</p>
        <div className="flex gap-2">
          <Label htmlFor="codigo-livre-container" className="sr-only">Código livre</Label>
          <Input
            id="codigo-livre-container"
            value={codigo}
            disabled={noTeto}
            onChange={(event) => setCodigo(event.target.value)}
            placeholder="Identificador"
          />
          <Button type="submit" disabled={noTeto || codigo.trim().length === 0}>Vincular</Button>
        </div>
      </form>
    </>
  );
}

function moldura(open: boolean, onOpenChange: (open: boolean) => void, miolo: ReactNode) {
  if (typeof document === "undefined") {
    return <div role="dialog">{miolo}</div>;
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg gap-4" aria-describedby="busca-containers-descricao">
        <DialogHeader>
          <DialogTitle>Buscar mais containers</DialogTitle>
          <DialogDescription id="busca-containers-descricao">
            Containers aptos desta carga. A busca olha o código.
          </DialogDescription>
        </DialogHeader>
        {miolo}
      </DialogContent>
    </Dialog>
  );
}

export default function BuscarContainersDialog({ open, onOpenChange, ...busca }: Props) {
  if (!open) return null;
  return moldura(open, onOpenChange, <Busca {...busca} />);
}
