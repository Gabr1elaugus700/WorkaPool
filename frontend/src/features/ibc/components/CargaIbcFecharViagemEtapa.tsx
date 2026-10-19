import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { useConciliacaoViagem } from "../hooks/useConciliacaoViagem";
import type { ConciliacaoViagemDTO } from "../types/conciliacaoViagem.types";
import ConciliacaoIbcLinha from "./ConciliacaoIbcLinha";
import ConciliacaoPedidoBarras from "./ConciliacaoPedidoBarras";
import ConciliacaoRetornosPainel from "./ConciliacaoRetornosPainel";
import ConciliacaoTrocaDialog from "./ConciliacaoTrocaDialog";

type Props = {
  codCar: number;
  viagem: ConciliacaoViagemDTO;
  conciliacao: ReturnType<typeof useConciliacaoViagem>;
};

export default function CargaIbcFecharViagemEtapa({ codCar, viagem, conciliacao }: Props) {
  const [trocaId, setTrocaId] = useState<string | null>(null);
  const { fechada, salvando, marcados, total, aviso } = conciliacao;
  const trocaAberta = viagem.itens.find((item) => item.alocacaoIbcId === trocaId) ?? null;
  const bloqueada = fechada || salvando || conciliacao.pedindoConfirmacao;

  return (
    <section aria-label="Fechar viagem">
      <p className="mb-4 max-w-[65ch] text-sm text-muted-foreground">
        {fechada
          ? "Esta viagem já foi fechada. A conciliação fica só para consulta."
          : `Aponte o pedido do que ficou ou foi trocado. O que voltou no caminhão não leva pedido. ${marcados} de ${total} IBCs com destino.`}
      </p>
      {aviso ? (
        <Alert className="mb-4" variant="destructive">
          <AlertDescription>{aviso}</AlertDescription>
        </Alert>
      ) : null}
      <ConciliacaoPedidoBarras pedidos={conciliacao.barras} />
      <div className="flex flex-col gap-3">
        {viagem.itens.map((item) => (
          <ConciliacaoIbcLinha
            key={item.alocacaoIbcId}
            item={item}
            pedidos={viagem.pedidos}
            disabled={bloqueada}
            onDestino={(destino) => conciliacao.marcarDestino(item.alocacaoIbcId, destino)}
            onPedido={(numPed) => conciliacao.marcarPedido(item.alocacaoIbcId, numPed)}
            onTroca={() => setTrocaId(item.alocacaoIbcId)}
          />
        ))}
      </div>
      <ConciliacaoRetornosPainel
        clientes={viagem.clientes}
        itens={viagem.itens}
        disabled={bloqueada}
        onChange={conciliacao.atualizarCliente}
      />
      {trocaAberta ? (
        <ConciliacaoTrocaDialog
          codCar={codCar}
          alocacaoIbcId={trocaAberta.alocacaoIbcId}
          identificador={trocaAberta.identificador}
          open
          onOpenChange={(open) => { if (!open) setTrocaId(null); }}
          onRegistrada={(ibcEntradaId) => conciliacao.vincularTroca(trocaAberta.alocacaoIbcId, ibcEntradaId)}
        />
      ) : null}
      {fechada ? null : conciliacao.pedindoConfirmacao ? (
        <div className="mt-6 border-t border-border pt-4" aria-live="polite">
          <p className="max-w-[65ch] text-sm text-foreground">
            Estes pedidos não fecham o esperado. Confirme para fechar a viagem.
          </p>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            {conciliacao.divergencias.map((pedido) => (
              <li key={pedido.numPed}>
                Pedido {pedido.numPed} · {pedido.cliente} — {pedido.quantidadeApontada} de {pedido.quantidadeEsperada}
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
            <Button type="button" variant="outline" disabled={salvando} onClick={conciliacao.cancelarConfirmacao}>
              Voltar
            </Button>
            <Button type="button" disabled={salvando} onClick={() => void conciliacao.confirmarFechamento()}>
              Confirmar e fechar
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-6 flex flex-wrap items-center justify-end gap-2 border-t border-border pt-4">
          <Button type="button" variant="outline" disabled={salvando} onClick={() => void conciliacao.salvarAndamento()}>
            Salvar andamento
          </Button>
          <Button type="button" disabled={!conciliacao.podeFechar} onClick={() => void conciliacao.fecharViagem()}>
            Fechar viagem
          </Button>
        </div>
      )}
    </section>
  );
}
