import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { ContainerPaletaDTO, ContainersCargaDTO } from "../types/ibcExpedicao.types";
import { containersCarga, type SecaoContainersCarga } from "../utils/containersCarga";
import BuscarContainersDialog from "./BuscarContainersDialog";
import CargaIbcSecaoContainers from "./CargaIbcSecaoContainers";
import IbcContainerChip from "./IbcContainerChip";

/** Duas linhas de chips por seção antes de abrir a busca. */
const CHIPS_VISIVEIS_POR_SECAO = 8;

const MOTIVO_TETO = "A quantidade esperada da carga já está vinculada.";

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

function secaoVisivel(secao: SecaoContainersCarga): SecaoContainersCarga {
  return {
    ...secao,
    containers: containersCarga.limitarVisiveis(secao.containers, CHIPS_VISIVEIS_POR_SECAO).visiveis,
  };
}

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
  const motivoTeto = noTeto ? MOTIVO_TETO : undefined;
  const secoes = paleta == null ? [] : containersCarga.agruparDisponiveis(paleta);

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
          {mutationsLocked ? null : (
            <>
              {secoes.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum container disponível para esta carga.</p>
              ) : (
                secoes.map((secao) => (
                  <CargaIbcSecaoContainers
                    key={secao.tipo === "grupo" ? secao.grupoCodigo : secao.tipo}
                    secao={secaoVisivel(secao)}
                    estado="disponivel"
                    desabilitado={noTeto}
                    motivoBloqueio={motivoTeto}
                    onSelect={(container) => onVincular(container.identificador)}
                  />
                ))
              )}
              {noTeto ? <p className="text-sm font-medium text-foreground">{MOTIVO_TETO}</p> : null}
              <Button type="button" variant="outline" size="sm" onClick={() => setBuscaAberta(true)}>
                Buscar mais containers
              </Button>
              <BuscarContainersDialog
                open={buscaAberta}
                onOpenChange={setBuscaAberta}
                paleta={paleta}
                termo={termo}
                onTermoChange={setTermo}
                noTeto={noTeto}
                motivoTeto={motivoTeto}
                onVincular={onVincular}
                onVincularCodigo={onVincular}
              />
            </>
          )}
        </>
      )}
    </div>
  );
}
