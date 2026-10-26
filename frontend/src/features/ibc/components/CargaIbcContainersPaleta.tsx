import { useRef, useState, type ReactNode, type RefObject } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AlocacaoIbcDTO, ContainerCargaDTO } from "../types/ibcExpedicao.types";
import type { PaletaContainers } from "../utils/containersCarga";
import { containersCarga } from "../utils/containersCarga";
import BuscarContainersDialog from "./BuscarContainersDialog";
import CargaIbcSecaoContainers from "./CargaIbcSecaoContainers";
import IbcContainerChip from "./IbcContainerChip";

/** Cerca de duas linhas de chips no cartão; o resto fica no modal. */
const LIMITE_VISIVEL = 12;

type Props = {
  paleta: PaletaContainers | null;
  erro: Error | null;
  onRecarregar: () => void;
  /** Vínculos do detalhe: aparecem enquanto a paleta carrega. */
  alocacoes: readonly AlocacaoIbcDTO[];
  descricaoBusca: string;
  mutationsLocked: boolean;
  motivoBloqueio: string | null;
  allocating: boolean;
  deallocatingId: string | null;
  aviso: ReactNode;
  onAllocate: (identificador: string) => Promise<boolean>;
  onDeallocate: (alocacaoId: string) => Promise<void>;
};

function Rotulo({ children, headingRef }: { children: ReactNode; headingRef?: RefObject<HTMLHeadingElement | null> }) {
  return (
    <h3 ref={headingRef} tabIndex={-1} className="text-sm font-medium text-foreground focus:outline-none">
      {children}
    </h3>
  );
}

function provisorio(alocacao: AlocacaoIbcDTO): ContainerCargaDTO {
  return {
    ibcId: alocacao.ibcId,
    identificador: alocacao.identificador,
    grupoCodigo: null,
    sigla: null,
    corHex: null,
    universal: false,
    homologado: true,
    alocacaoId: alocacao.id,
  };
}

export default function CargaIbcContainersPaleta({
  paleta,
  erro,
  onRecarregar,
  alocacoes,
  descricaoBusca,
  mutationsLocked,
  motivoBloqueio,
  allocating,
  deallocatingId,
  aviso,
  onAllocate,
  onDeallocate,
}: Props) {
  const [pendente, setPendente] = useState<string | null>(null);
  const [buscaAberta, setBuscaAberta] = useState(false);
  const [anuncio, setAnuncio] = useState("");
  const naCargaRef = useRef<HTMLHeadingElement>(null);
  const disponiveisRef = useRef<HTMLHeadingElement>(null);

  const vincular = async (identificador: string): Promise<boolean> => {
    setPendente(identificador);
    try {
      const ok = await onAllocate(identificador);
      setAnuncio(ok ? `${identificador} vinculado.` : `${identificador} não foi vinculado.`);
      if (!buscaAberta) disponiveisRef.current?.focus();
      return ok;
    } finally {
      setPendente(null);
    }
  };

  const desvincular = async (container: ContainerCargaDTO) => {
    if (!container.alocacaoId) return;
    await onDeallocate(container.alocacaoId);
    setAnuncio(`${container.identificador} desvinculado.`);
    naCargaRef.current?.focus();
  };

  const naCarga = paleta?.naCarga ?? alocacoes.map(provisorio);
  const secoes = paleta?.secoes ?? [];
  const visivel = containersCarga.limitar(secoes, LIMITE_VISIVEL);
  const totalPorSecao = new Map(secoes.map((secao) => [secao.chave, secao.itens.length]));
  const bloqueado = motivoBloqueio != null || allocating;

  return (
    <div className="space-y-5">
      <p aria-live="polite" className="sr-only">
        {buscaAberta ? "" : anuncio}
      </p>
      <div className="space-y-2">
        <Rotulo headingRef={naCargaRef}>Na carga</Rotulo>
        {naCarga.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {mutationsLocked ? "Nenhum container vinculado." : "Nenhum container vinculado. Clique em um disponível para incluir na carga."}
          </p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {naCarga.map((container) => (
              <li key={container.ibcId}>
                <IbcContainerChip
                  container={container}
                  estado={mutationsLocked || paleta == null ? "estatico" : "vinculado"}
                  carregando={container.alocacaoId != null && deallocatingId === container.alocacaoId}
                  disabled={deallocatingId != null}
                  onClick={() => void desvincular(container)}
                />
              </li>
            ))}
          </ul>
        )}
      </div>

      {mutationsLocked ? null : (
        <div className="space-y-3 border-t border-border pt-4">
          <Rotulo headingRef={disponiveisRef}>Disponíveis</Rotulo>
          {erro ? (
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-sm text-destructive">Não foi possível carregar os containers disponíveis.</p>
              <Button type="button" variant="outline" size="sm" onClick={onRecarregar}>
                Tentar de novo
              </Button>
            </div>
          ) : paleta == null ? (
            <p className="text-sm text-muted-foreground">Carregando containers disponíveis…</p>
          ) : visivel.secoes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum container livre e compatível com os produtos desta carga. Busque pelo código se precisar.
            </p>
          ) : (
            visivel.secoes.map((secao) => (
              <CargaIbcSecaoContainers
                key={secao.chave}
                secao={secao}
                total={totalPorSecao.get(secao.chave)}
                disabled={bloqueado}
                pendente={pendente}
                onVincular={(identificador) => void vincular(identificador)}
              />
            ))
          )}

          {buscaAberta ? null : aviso}

          <div className="flex flex-wrap items-center justify-end gap-3">
            {visivel.ocultos > 0 ? (
              <span className="text-xs text-muted-foreground tabular-nums">
                +{visivel.ocultos} {visivel.ocultos === 1 ? "disponível" : "disponíveis"} na busca
              </span>
            ) : null}
            <Button type="button" variant="outline" size="sm" onClick={() => setBuscaAberta(true)}>
              <Plus aria-hidden className="h-4 w-4" />
              Buscar mais containers
            </Button>
          </div>

          <BuscarContainersDialog
            open={buscaAberta}
            onOpenChange={setBuscaAberta}
            descricao={descricaoBusca}
            naCarga={naCarga}
            secoes={secoes}
            motivoBloqueio={motivoBloqueio}
            pendente={pendente}
            aviso={buscaAberta ? aviso : null}
            anuncio={buscaAberta ? anuncio : ""}
            onVincular={vincular}
          />
        </div>
      )}
    </div>
  );
}
