import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { useConciliacaoViagem } from "../hooks/useConciliacaoViagem";
import type { ConciliacaoViagemDTO } from "../types/conciliacaoViagem.types";
import ConciliacaoIbcLinha from "./ConciliacaoIbcLinha";
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
  const bloqueada = fechada || salvando;

  return (
    <section aria-label="Fechar viagem">
      <p className="mb-4 max-w-[65ch] text-sm text-muted-foreground">
        {fechada
          ? "Esta viagem já foi fechada. O checklist fica só para consulta."
          : `${marcados} de ${total} IBCs marcados. Salve o andamento e feche quando o papel estiver completo.`}
      </p>
      {aviso ? (
        <Alert className="mb-4" variant="destructive">
          <AlertDescription>{aviso}</AlertDescription>
        </Alert>
      ) : null}
      <div className="flex flex-col gap-3">
        {viagem.itens.map((item) => (
          <ConciliacaoIbcLinha
            key={item.alocacaoIbcId}
            item={item}
            disabled={bloqueada}
            onDestino={(destino) => conciliacao.marcarDestino(item.alocacaoIbcId, destino)}
            onModalidade={(modalidade) => conciliacao.marcarModalidade(item.alocacaoIbcId, modalidade)}
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
      {fechada ? null : (
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
