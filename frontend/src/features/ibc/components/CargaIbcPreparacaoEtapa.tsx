import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { SubstituidoNotice } from "../hooks/useCargaExpedicaoDetalhe";
import type { CargaExpedicaoDetalheDTO, ContainersCargaDTO, PedidoIbcPreparacaoDTO } from "../types/ibcExpedicao.types";
import { ibcProdutoCompatibilidade } from "../utils/ibcProdutoCompatibilidade";
import { separarPedidosForaDaSoma } from "../utils/pedidosForaDaSoma";
import CargaIbcContainersPaleta from "./CargaIbcContainersPaleta";
import PedidoIbcProgress from "./PedidoIbcProgress";

type Props = {
  detalhe: CargaExpedicaoDetalheDTO;
  mutationsLocked: boolean;
  substituidoNotice: SubstituidoNotice | null;
  paleta: ContainersCargaDTO | null;
  paletaCarregando: boolean;
  paletaErro: string | null;
  anuncio: string | null;
  onRecarregarPaleta: () => void;
  onAllocate: (identificador: string) => Promise<boolean>;
  onDeallocate: (alocacaoId: string) => Promise<void>;
};

const NOTICE_ID = "ibc-alocacao-aviso-carga";

function percentualVinculado(alocado: number, esperado: number): number {
  if (esperado <= 0) return 0;
  return Math.min(100, Math.round((alocado / esperado) * 100));
}

function rotuloPedido(pedido: PedidoIbcPreparacaoDTO): string {
  return pedido.cliente ? `Pedido ${pedido.numPed} · ${pedido.cliente}` : `Pedido ${pedido.numPed}`;
}

function textoFaixaCompleta(esperado: number): string {
  const gesto = esperado === 1
    ? "Toque no container vinculado para trocá-lo."
    : "Toque em um container vinculado para trocá-lo.";
  return `A quantidade esperada da carga está completa. ${gesto}`;
}

export default function CargaIbcPreparacaoEtapa({
  detalhe,
  mutationsLocked,
  substituidoNotice,
  paleta,
  paletaCarregando,
  paletaErro,
  anuncio,
  onRecarregarPaleta,
  onAllocate,
  onDeallocate,
}: Props) {
  const { mistos, invalidos } = separarPedidosForaDaSoma(detalhe.pedidos);
  const avisosGrupo = ibcProdutoCompatibilidade.avisosDe(detalhe.avisos);
  const alocado = detalhe.quantidadeAlocada;
  const esperado = detalhe.quantidadeEsperadaTotal;
  const percentual = percentualVinculado(alocado, esperado);
  const noTeto = esperado > 0 && alocado >= esperado;
  const semEsperado = esperado <= 0;
  return (
    <section aria-label="Containers da carga" className="space-y-4">
      {mistos.length > 0 ? (
        <Alert className="border-amber-700/30 bg-amber-500/10 text-foreground [&>svg]:text-amber-700 dark:[&>svg]:text-amber-400">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Pedido misto fora do total</AlertTitle>
          <AlertDescription>
            <p>
              {mistos.length === 1
                ? "Este pedido tem cota de incluso e de empréstimo ao mesmo tempo. Fica fora da soma e não é cota para vincular."
                : "Estes pedidos têm cota de incluso e de empréstimo ao mesmo tempo. Ficam fora da soma e não são cota para vincular."}
            </p>
            <ul className="mt-2 space-y-1">
              {mistos.map((pedido) => (
                <li key={pedido.numPed}>{rotuloPedido(pedido)}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      ) : null}

      {avisosGrupo.length > 0 ? (
        <Alert className="border-amber-700/30 bg-amber-500/10 text-foreground [&>svg]:text-amber-700 dark:[&>svg]:text-amber-400">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Grupo sem configuração de placa e cor</AlertTitle>
          <AlertDescription>
            <ul className="space-y-1">
              {avisosGrupo.map((aviso) => (
                <li key={aviso.numPed}>{ibcProdutoCompatibilidade.textoAviso(aviso)}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      ) : null}

      {invalidos.length > 0 ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Pedido IBC inválido fora do total</AlertTitle>
          <AlertDescription>
            <p>A quantidade esperada não pôde ser calculada. O restante da carga segue.</p>
            <ul className="mt-2 space-y-1">
              {invalidos.map((pedido) => (
                <li key={pedido.numPed}>{rotuloPedido(pedido)}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-4 rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="space-y-2">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <h2 className="text-lg font-semibold leading-snug text-foreground">Containers vinculados</h2>
            <p className="text-sm text-muted-foreground">
              <PedidoIbcProgress alocado={alocado} esperado={esperado} tom="preparacao" />
              <span className="sr-only">
                {" "}
                de {esperado} {esperado === 1 ? "container" : "containers"}
              </span>
            </p>
          </div>
          <div
            className="h-2.5 w-full overflow-hidden rounded-full bg-secondary"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={Math.max(esperado, 0)}
            aria-valuenow={Math.min(alocado, Math.max(esperado, 0))}
            aria-label="Containers vinculados na carga"
          >
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-200 ease-out"
              style={{ width: `${percentual}%` }}
            />
          </div>
          {mutationsLocked ? (
            <p className="text-sm text-muted-foreground">Expedição fechada. Os vínculos são só consulta.</p>
          ) : semEsperado ? (
            <p className="text-sm text-muted-foreground">Não há quantidade esperada para vincular nesta carga.</p>
          ) : noTeto ? (
            <p className="rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-foreground">
              {textoFaixaCompleta(esperado)}
            </p>
          ) : null}
        </div>

        <CargaIbcContainersPaleta
          paleta={paleta}
          carregando={paletaCarregando}
          erro={paletaErro}
          mutationsLocked={mutationsLocked}
          noTeto={noTeto}
          anuncio={anuncio}
          onRecarregar={onRecarregarPaleta}
          onVincular={(identificador) => {
            void onAllocate(identificador);
          }}
          onDesvincular={(alocacaoId) => {
            void onDeallocate(alocacaoId);
          }}
        />

        {substituidoNotice ? (
          <Alert variant="destructive" id={NOTICE_ID}>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{substituidoNotice.title}</AlertTitle>
            <AlertDescription>{substituidoNotice.message}</AlertDescription>
          </Alert>
        ) : null}
      </div>
    </section>
  );
}
