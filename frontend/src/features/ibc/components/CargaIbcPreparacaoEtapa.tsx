import type { SubstituidoNotice } from "../hooks/useCargaExpedicaoDetalhe";
import type { CargaExpedicaoDetalheDTO } from "../types/ibcExpedicao.types";
import PedidoIbcPreparacaoCard from "./PedidoIbcPreparacaoCard";
import PedidoIbcProgress from "./PedidoIbcProgress";

type Props = {
  detalhe: CargaExpedicaoDetalheDTO;
  mutationsLocked: boolean;
  allocatingNumPed: string | null;
  deallocatingId: string | null;
  substituidoNotice: SubstituidoNotice | null;
  onAllocate: (numPed: string, identificador: string) => Promise<boolean>;
  onDeallocate: (alocacaoId: string) => Promise<void>;
};

export default function CargaIbcPreparacaoEtapa({
  detalhe,
  mutationsLocked,
  allocatingNumPed,
  deallocatingId,
  substituidoNotice,
  onAllocate,
  onDeallocate,
}: Props) {
  return (
    <section aria-label="Pedidos IBC da carga">
      <p className="mb-4 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        Carga {detalhe.situacao} · Progresso IBC:
        <PedidoIbcProgress alocado={detalhe.quantidadeAlocada} esperado={detalhe.quantidadeEsperadaTotal} />
        {mutationsLocked ? <span>· Expedição fechada, vínculos só para consulta.</span> : null}
      </p>
      {detalhe.pedidos.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum pedido IBC nesta carga.</p>
      ) : (
        <div className="space-y-3">
          {detalhe.pedidos.map((pedido) => (
            <PedidoIbcPreparacaoCard
              key={pedido.numPed}
              pedido={pedido}
              mutationsLocked={mutationsLocked}
              allocating={allocatingNumPed === pedido.numPed}
              deallocatingId={deallocatingId}
              allocationNotice={substituidoNotice?.numPed === pedido.numPed ? substituidoNotice : null}
              onAllocate={(identificador) => onAllocate(pedido.numPed, identificador)}
              onDeallocate={onDeallocate}
            />
          ))}
        </div>
      )}
    </section>
  );
}
