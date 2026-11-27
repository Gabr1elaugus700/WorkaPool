import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { DestinoConciliacao } from "../types/conciliacaoViagem.types";
import { conciliacaoVolta, type BlocoClienteConciliacao, type SecaoConciliacao } from "../utils/conciliacaoVolta.utils";
import IbcContainerChip from "./IbcContainerChip";
import IbcPlacaAmostra from "./IbcPlacaAmostra";

const COLUNAS: ReadonlyArray<{ id: DestinoConciliacao; label: string }> = [
  { id: "FICOU", label: "Ficou no cliente" },
  { id: "TROCA", label: "Troca" },
  { id: "RETORNOU", label: "Retornou no caminhão" },
];

type Props = {
  bloco: BlocoClienteConciliacao;
  disabled: boolean;
  onAlternarDestino: (alocacaoIbcId: string, destino: DestinoConciliacao, numPed: string) => void;
};

const rotuloSecao = (s: SecaoConciliacao) =>
  `${s.sigla ? `${s.grupoCodigo} · ${s.sigla}` : (s.grupoCodigo ?? "")}${s.grupoDescricao ? ` ${s.grupoDescricao}` : ""}`;

export default function ConciliacaoClienteBloco({ bloco, disabled, onAlternarDestino }: Props) {
  const rotulo = conciliacaoVolta.rotuloVendedores(bloco.subBlocos.map((sub) => sub.vendedor));
  const soma = bloco.ficou + bloco.troca;
  const pctFicou = soma === 0 ? 0 : Math.round((bloco.ficou / soma) * 100);
  const pctTroca = soma === 0 ? 0 : 100 - pctFicou;

  return (
    <article className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-base font-semibold text-foreground">
          {bloco.cliente}
          {rotulo ? <span className="ml-2 text-sm font-normal text-muted-foreground">{rotulo}</span> : null}
        </h2>
        <p className="text-xs font-medium tabular-nums text-muted-foreground">Ficou: {bloco.ficou} · Troca: {bloco.troca}</p>
      </div>
      <div role="img" aria-label={`${bloco.cliente}: ${bloco.ficou} ficou, ${bloco.troca} troca`} className="mt-2 flex h-2 overflow-hidden rounded-full bg-secondary">
        <div className="h-full bg-primary transition-[width] duration-200" style={{ width: `${pctFicou}%` }} />
        <div className="h-full bg-foreground/45 transition-[width] duration-200" style={{ width: `${pctTroca}%` }} />
      </div>
      <div className="mt-4 flex flex-col gap-4">
        {bloco.subBlocos.map((sub) => (
          <div key={sub.numPed} className="rounded-md border border-border bg-background/60 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-semibold text-foreground">Pedido {sub.numPed}</h3>
                {sub.incluso ? <Badge variant="secondary">Incluso</Badge> : null}
              </div>
              <span className="text-xs font-medium tabular-nums text-muted-foreground">Esperado: {sub.quantidadeEsperada}</span>
            </div>
            {sub.secoes.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">Nenhum container compatível disponível.</p>
            ) : (
              <div className="mt-3 space-y-3">
                {sub.secoes.map((secao) => (
                  <div key={secao.grupoCodigo ?? secao.tipo} className="space-y-2">
                    <h4 className="flex items-center gap-2 text-xs font-medium text-foreground">
                      {secao.tipo === "universal" ? <><IbcPlacaAmostra className="h-4 w-4" /><span>Universal</span></> : secao.tipo === "grupo" ? <><IbcPlacaAmostra className="h-4 w-4" corHex={secao.corHex} /><span>{rotuloSecao(secao)}</span></> : <span>Sem grupo</span>}
                    </h4>
                    <ul className="space-y-2">
                      {secao.itens.map((item) => (
                        <li key={item.alocacaoIbcId} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-card px-3 py-2">
                          <IbcContainerChip estado="estatico" container={conciliacaoVolta.chip(item)} />
                          <div className="grid grid-cols-3 gap-1.5">
                            {COLUNAS.map((col) => {
                              const ativo = item.destino === col.id && item.numPed === sub.numPed;
                              return (
                                <button key={col.id} type="button" disabled={disabled} aria-pressed={ativo} aria-label={`${col.label} — ${item.identificador}`} onClick={() => onAlternarDestino(item.alocacaoIbcId, col.id, sub.numPed)} className={cn("h-8 rounded-md border px-2.5 text-xs font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60", ativo ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-foreground hover:bg-accent")}>
                                  {col.label}
                                </button>
                              );
                            })}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </article>
  );
}
