import { useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ContainerPaletaDTO, ContainersCargaDTO } from "../types/ibcExpedicao.types";
import { containersCarga } from "../utils/containersCarga";
import BuscarContainersDialog from "./BuscarContainersDialog";
import CargaIbcSecaoContainers from "./CargaIbcSecaoContainers";
import IbcContainerChip from "./IbcContainerChip";

/** Duas linhas de chips por seção antes de abrir a busca. */
const CHIPS_VISIVEIS_POR_SECAO = 8;

type Props = {
  paleta: ContainersCargaDTO | null;
  carregando: boolean;
  erro: string | null;
  mutationsLocked: boolean;
  noTeto: boolean;
  anuncio: string | null;
  onRecarregar: () => void;
  onVincular: (identificador: string) => void;
  onDesvincular: (alocacaoId: string) => void;
};

function FaixaVinculados({
  vinculados,
  estatico,
  onDesvincular,
}: {
  vinculados: readonly ContainerPaletaDTO[];
  estatico: boolean;
  onDesvincular: (alocacaoId: string) => void;
}) {
  const ordenados = [...vinculados].sort((a, b) =>
    a.identificador.localeCompare(b.identificador, "pt-BR", { numeric: true }),
  );
  return (
    <section className="space-y-2" aria-label="Na carga">
      <h3 className="text-sm font-medium text-foreground">Na carga</h3>
      {ordenados.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum container vinculado.</p>
      ) : (
        <ul className="flex max-h-16 flex-wrap gap-2 overflow-hidden">
          {ordenados.map((container) => (
            <li key={container.identificador}>
              <IbcContainerChip
                container={container}
                estado={estatico ? "estatico" : "vinculado"}
                onSelect={
                  estatico || container.alocacaoId == null
                    ? undefined
                    : () => onDesvincular(container.alocacaoId as string)
                }
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function CargaIbcContainersPaleta({
  paleta,
  carregando,
  erro,
  mutationsLocked,
  noTeto,
  anuncio,
  onRecarregar,
  onVincular,
  onDesvincular,
}: Props) {
  const [buscaAberta, setBuscaAberta] = useState(false);
  const [termo, setTermo] = useState("");
  const secoes = paleta == null ? [] : containersCarga.agruparDisponiveis(paleta);
  const mostrarDisponiveis = !mutationsLocked && !noTeto;

  return (
    <div className="space-y-4">
      <div className="sr-only" aria-live="polite">
        {anuncio}
      </div>
      {erro ? (
        <div className="space-y-2">
          <p className="text-sm text-destructive">{erro}</p>
          <Button type="button" variant="outline" size="sm" onClick={onRecarregar}>
            Tentar de novo
          </Button>
        </div>
      ) : carregando || paleta == null ? (
        <p className="text-sm text-muted-foreground">Carregando containers…</p>
      ) : (
        <>
          <FaixaVinculados
            vinculados={paleta.vinculados}
            estatico={mutationsLocked}
            onDesvincular={onDesvincular}
          />
          {mostrarDisponiveis ? (
            <>
              {secoes.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum container disponível para esta carga.</p>
              ) : (
                secoes.map((secao) => (
                  <CargaIbcSecaoContainers
                    key={secao.tipo === "grupo" ? secao.grupoCodigo : secao.tipo}
                    secao={secao}
                    limite={CHIPS_VISIVEIS_POR_SECAO}
                    estado="disponivel"
                    onSelect={(container) => onVincular(container.identificador)}
                  />
                ))
              )}
              <Button
                type="button"
                variant="outline"
                className="w-full border-dashed border-border bg-transparent text-foreground hover:border-primary hover:bg-primary/10 hover:text-primary focus-visible:border-primary focus-visible:bg-primary/10 focus-visible:text-primary"
                onClick={() => setBuscaAberta(true)}
              >
                <Search aria-hidden />
                Buscar mais containers
              </Button>
              <BuscarContainersDialog
                open={buscaAberta}
                onOpenChange={setBuscaAberta}
                paleta={paleta}
                termo={termo}
                onTermoChange={setTermo}
                noTeto={false}
                onVincular={onVincular}
                onVincularCodigo={onVincular}
              />
            </>
          ) : null}
        </>
      )}
    </div>
  );
}
