import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { PedidoIbcPreparacaoDTO } from "../types/ibcExpedicao.types";
import AllocateIbcForm from "./AllocateIbcForm";
import DeallocateIbcButton from "./DeallocateIbcButton";
import PedidoIbcProgress from "./PedidoIbcProgress";

type Props = {
  pedido: PedidoIbcPreparacaoDTO;
  mutationsLocked?: boolean;
  allocating?: boolean;
  deallocatingId?: string | null;
  onAllocate: (identificador: string) => Promise<void>;
  onDeallocate: (alocacaoId: string) => Promise<void>;
};

/**
 * Card de pedido IBC na preparação: progresso, alocações e formulário.
 */
export default function PedidoIbcPreparacaoCard({
  pedido,
  mutationsLocked = false,
  allocating = false,
  deallocatingId = null,
  onAllocate,
  onDeallocate,
}: Props) {
  const atLimit =
    pedido.quantidadeEsperadaTotal > 0 &&
    pedido.quantidadeAlocada >= pedido.quantidadeEsperadaTotal;
  const formDisabled = mutationsLocked || pedido.ibcInvalido || atLimit;

  return (
    <div className="rounded-xl border-2 border-border bg-card p-4 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-base font-bold text-foreground">
            Pedido {pedido.numPed}
          </h3>
          {pedido.cliente ? (
            <p className="text-sm text-muted-foreground">{pedido.cliente}</p>
          ) : null}
          <p className="text-xs text-muted-foreground mt-1">
            Venda: {pedido.quantidadeEsperadaVenda} · Empréstimo:{" "}
            {pedido.quantidadeEsperadaEmprestimo}
          </p>
        </div>
        <PedidoIbcProgress
          alocado={pedido.quantidadeAlocada}
          esperado={pedido.quantidadeEsperadaTotal}
        />
      </div>

      {pedido.ibcInvalido ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Pedido IBC inválido</AlertTitle>
          <AlertDescription>
            Este pedido não pode receber alocações até o cálculo de quantidade
            esperada ser corrigido.
          </AlertDescription>
        </Alert>
      ) : null}

      {pedido.alocacoes.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            IBCs vinculados
          </p>
          {pedido.alocacoes.map((alocacao) => (
            <DeallocateIbcButton
              key={alocacao.id}
              identificador={alocacao.identificador}
              disabled={mutationsLocked}
              loading={deallocatingId === alocacao.id}
              onDeallocate={() => {
                void onDeallocate(alocacao.id);
              }}
            />
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Nenhum IBC vinculado.</p>
      )}

      {!mutationsLocked ? (
        <AllocateIbcForm
          inputId={`ibc-identificador-${pedido.numPed}`}
          disabled={formDisabled}
          submitting={allocating}
          onSubmit={onAllocate}
        />
      ) : null}
    </div>
  );
}
