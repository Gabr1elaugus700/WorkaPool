import { useMemo } from "react";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type {
  ConciliacaoViagemDTO,
  DestinoConciliacao,
  PedidoConciliacaoDTO,
} from "../types/conciliacaoViagem.types";
import type { PlacaGrupoPaletaDTO } from "../types/ibcExpedicao.types";
import { conciliacaoVolta } from "../utils/conciliacaoVolta.utils";
import { ibcProdutoCompatibilidade } from "../utils/ibcProdutoCompatibilidade";
import ConciliacaoClienteBloco from "./ConciliacaoClienteBloco";
import IbcContainerChip from "./IbcContainerChip";

type Props = {
  viagem: ConciliacaoViagemDTO;
  grupos: readonly PlacaGrupoPaletaDTO[];
  chegaramAMais: string;
  aviso: string | null;
  salvando: boolean;
  fechada: boolean;
  marcados: number;
  total: number;
  podeFechar: boolean;
  divergencias: readonly PedidoConciliacaoDTO[];
  pedindoConfirmacao: boolean;
  onAlternarDestino: (alocacaoIbcId: string, destino: DestinoConciliacao, numPed: string | null) => void;
  onChegaramAMaisChange: (valor: string) => void;
  onSalvar: () => void;
  onFechar: () => void;
  onConfirmarFechamento: () => void;
  onCancelarConfirmacao: () => void;
};

export default function CargaIbcFecharViagemEtapa({
  viagem,
  grupos,
  chegaramAMais,
  aviso,
  salvando,
  fechada,
  marcados,
  total,
  podeFechar,
  divergencias,
  pedindoConfirmacao,
  onAlternarDestino,
  onChegaramAMaisChange,
  onSalvar,
  onFechar,
  onConfirmarFechamento,
  onCancelarConfirmacao,
}: Props) {
  const bloqueada = fechada || salvando || pedindoConfirmacao;
  const visao = useMemo(() => conciliacaoVolta.montarVisao(viagem, grupos), [viagem, grupos]);

  return (
    <section aria-label="Fechar viagem">
      <p className="mb-4 max-w-[65ch] text-sm text-muted-foreground">
        {fechada
          ? "Esta viagem já foi fechada. A conciliação fica só para consulta."
          : `Aponte o destino de cada container por cliente e pedido. ${marcados} de ${total} IBCs com destino.`}
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
      <div className="flex flex-col gap-4">
        {visao.clientes.map((bloco) => (
          <ConciliacaoClienteBloco key={bloco.chaveCliente} bloco={bloco} disabled={bloqueada} onAlternarDestino={onAlternarDestino} />
        ))}
      </div>
      <section aria-label="Retornou no caminhão" className="mt-6 rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-base font-semibold text-foreground">Retornou no caminhão</h2>
          <span className="text-sm font-medium tabular-nums text-muted-foreground">{visao.retornaram.length}</span>
        </div>
        {visao.retornaram.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Nenhum container marcado como retorno.</p>
        ) : (
          <ul className="mt-3 flex flex-wrap gap-2">
            {visao.retornaram.map((item) => (
              <li key={item.alocacaoIbcId} className="inline-flex items-center gap-2 rounded-md border border-border bg-background p-1.5">
                <IbcContainerChip estado="estatico" container={conciliacaoVolta.chip(item)} />
                {bloqueada ? null : (
                  <Button type="button" variant="outline" size="sm" aria-label={`Desmarcar retorno de ${item.identificador}`} onClick={() => onAlternarDestino(item.alocacaoIbcId, "RETORNOU", null)}>
                    Desmarcar
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
      <div className="mt-4 rounded-lg border border-border bg-card p-4 shadow-sm">
        <label htmlFor="chegaram-a-mais" className="block text-sm font-semibold text-foreground">Chegaram a mais</label>
        <p className="mt-1 max-w-[65ch] text-xs text-muted-foreground">Quantidade inteira de containers extras trazidos na carga.</p>
        <Input id="chegaram-a-mais" type="number" min={0} step={1} inputMode="numeric" disabled={bloqueada} value={chegaramAMais} onChange={(event) => onChegaramAMaisChange(event.target.value)} className="mt-2 w-28 tabular-nums" />
      </div>
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
