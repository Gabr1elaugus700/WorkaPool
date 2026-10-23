import { useState } from "react";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type {
  ConciliacaoViagemClienteDTO,
  ConciliacaoViagemDTO,
  DestinoConciliacao,
  PedidoConciliacaoDTO,
} from "../types/conciliacaoViagem.types";
import { ibcProdutoCompatibilidade } from "../utils/ibcProdutoCompatibilidade";
import ConciliacaoIbcLinha from "./ConciliacaoIbcLinha";
import ConciliacaoPedidoBarras from "./ConciliacaoPedidoBarras";
import ConciliacaoRetornosPainel from "./ConciliacaoRetornosPainel";
import ConciliacaoTrocaDialog from "./ConciliacaoTrocaDialog";

type ClientePatch = Partial<Pick<ConciliacaoViagemClienteDTO, "quantidadePapel" | "confirmouDivergencia">>;

type Props = {
  codCar: number;
  viagem: ConciliacaoViagemDTO;
  aviso: string | null;
  salvando: boolean;
  fechada: boolean;
  marcados: number;
  total: number;
  podeFechar: boolean;
  barras: readonly PedidoConciliacaoDTO[];
  divergencias: readonly PedidoConciliacaoDTO[];
  pedindoConfirmacao: boolean;
  onDestino: (alocacaoIbcId: string, destino: DestinoConciliacao) => void;
  onPedido: (alocacaoIbcId: string, numPed: string) => void;
  onTrocaRegistrada: (alocacaoIbcId: string, ibcEntradaId: string) => void;
  onClienteChange: (chaveCliente: string, patch: ClientePatch) => void;
  onSalvar: () => void;
  onFechar: () => void;
  onConfirmarFechamento: () => void;
  onCancelarConfirmacao: () => void;
};

export default function CargaIbcFecharViagemEtapa({
  codCar,
  viagem,
  aviso,
  salvando,
  fechada,
  marcados,
  total,
  podeFechar,
  barras,
  divergencias,
  pedindoConfirmacao,
  onDestino,
  onPedido,
  onTrocaRegistrada,
  onClienteChange,
  onSalvar,
  onFechar,
  onConfirmarFechamento,
  onCancelarConfirmacao,
}: Props) {
  const [trocaId, setTrocaId] = useState<string | null>(null);
  const trocaAberta = viagem.itens.find((item) => item.alocacaoIbcId === trocaId) ?? null;
  const bloqueada = fechada || salvando || pedindoConfirmacao;

  return (
    <section aria-label="Fechar viagem">
      <p className="mb-4 max-w-[65ch] text-sm text-muted-foreground">
        {fechada
          ? "Esta viagem já foi fechada. A conciliação fica só para consulta."
          : `Aponte o pedido do que ficou ou foi trocado. O que voltou no caminhão não leva pedido e não checa produto. ${marcados} de ${total} IBCs com destino.`}
      </p>
      {aviso ? (
        <Alert className="mb-4" variant="destructive">
          <AlertCircle className="h-4 w-4" />
          {ibcProdutoCompatibilidade.ehIncompativel(aviso) ? (
            <AlertTitle>{ibcProdutoCompatibilidade.tituloIncompativel}</AlertTitle>
          ) : null}
          <AlertDescription>{aviso}</AlertDescription>
        </Alert>
      ) : null}
      <ConciliacaoPedidoBarras pedidos={barras} />
      <div className="flex flex-col gap-3">
        {viagem.itens.map((item) => (
          <ConciliacaoIbcLinha
            key={item.alocacaoIbcId}
            item={item}
            pedidos={viagem.pedidos}
            disabled={bloqueada}
            onDestino={(destino) => onDestino(item.alocacaoIbcId, destino)}
            onPedido={(numPed) => onPedido(item.alocacaoIbcId, numPed)}
            onTroca={() => setTrocaId(item.alocacaoIbcId)}
          />
        ))}
      </div>
      <ConciliacaoRetornosPainel
        clientes={viagem.clientes}
        itens={viagem.itens}
        disabled={bloqueada}
        onChange={onClienteChange}
      />
      {trocaAberta ? (
        <ConciliacaoTrocaDialog
          codCar={codCar}
          alocacaoIbcId={trocaAberta.alocacaoIbcId}
          identificador={trocaAberta.identificador}
          open
          onOpenChange={(open) => { if (!open) setTrocaId(null); }}
          onRegistrada={(ibcEntradaId) => onTrocaRegistrada(trocaAberta.alocacaoIbcId, ibcEntradaId)}
        />
      ) : null}
      {fechada ? null : pedindoConfirmacao ? (
        <div className="mt-6 border-t border-border pt-4" aria-live="polite">
          <p className="max-w-[65ch] text-sm text-foreground">
            Estes pedidos não fecham o esperado. Confirme para fechar a viagem.
          </p>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            {divergencias.map((pedido) => (
              <li key={pedido.numPed}>
                Pedido {pedido.numPed} · {pedido.cliente} — {pedido.quantidadeApontada} de {pedido.quantidadeEsperada}
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
            <Button type="button" variant="outline" disabled={salvando} onClick={onCancelarConfirmacao}>
              Voltar
            </Button>
            <Button type="button" disabled={salvando} onClick={onConfirmarFechamento}>
              Confirmar e fechar
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-6 flex flex-wrap items-center justify-end gap-2 border-t border-border pt-4">
          <Button type="button" variant="outline" disabled={salvando} onClick={onSalvar}>
            Salvar andamento
          </Button>
          <Button type="button" disabled={!podeFechar} onClick={onFechar}>
            Fechar viagem
          </Button>
        </div>
      )}
    </section>
  );
}
