import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type {
  ConciliacaoViagemClienteDTO,
  ConciliacaoViagemDTO,
  DestinoConciliacao,
  ModalidadeConciliacao,
} from "../types/conciliacaoViagem.types";
import ConciliacaoIbcLinha from "./ConciliacaoIbcLinha";
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
  onDestino: (alocacaoIbcId: string, destino: DestinoConciliacao) => void;
  onModalidade: (alocacaoIbcId: string, modalidade: ModalidadeConciliacao) => void;
  onTrocaRegistrada: (alocacaoIbcId: string, ibcEntradaId: string) => void;
  onClienteChange: (chaveCliente: string, patch: ClientePatch) => void;
  onSalvar: () => void;
  onFechar: () => void;
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
  onDestino,
  onModalidade,
  onTrocaRegistrada,
  onClienteChange,
  onSalvar,
  onFechar,
}: Props) {
  const [trocaId, setTrocaId] = useState<string | null>(null);
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
            onDestino={(destino) => onDestino(item.alocacaoIbcId, destino)}
            onModalidade={(modalidade) => onModalidade(item.alocacaoIbcId, modalidade)}
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
      {fechada ? null : (
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
