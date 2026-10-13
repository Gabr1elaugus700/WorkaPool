import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatIsoDayMonthTimeLabel } from "@/utils/formatDate";
import { ibcCadastroLabels } from "../utils/ibcCadastroLabels";
import { entradaPatioOrigemLabel, entradaProntaParaConcluir } from "../utils/ibcEntradaPatio.utils";
import type { EntradaPatioFilaItem } from "../types/ibcEntradaPatio.types";

type Props = {
  item: EntradaPatioFilaItem;
  concluindo: boolean;
  onInspecionar: (item: EntradaPatioFilaItem) => void;
  onConcluir: (item: EntradaPatioFilaItem) => void;
};

export default function EntradaPatioFilaRow({ item, concluindo, onInspecionar, onConcluir }: Props) {
  const pronta = entradaProntaParaConcluir(item);
  const motivo = item.motivoInaptidao ? ibcCadastroLabels.motivoInaptidao[item.motivoInaptidao] : null;

  return (
    <article className="mb-3 rounded-xl border-2 border-border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-bold text-foreground">{item.identificador}</h2>
            <Badge variant="secondary">{entradaPatioOrigemLabel[item.origem]}</Badge>
            {motivo ? <Badge variant="outline">{motivo}</Badge> : null}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Aberta em {formatIsoDayMonthTimeLabel(item.abertoEm)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => onInspecionar(item)}>
            Inspecionar
          </Button>
          <Button type="button" disabled={!pronta || concluindo} onClick={() => onConcluir(item)}>
            {concluindo ? "Concluindo…" : "Concluir entrada"}
          </Button>
        </div>
      </div>
      {item.checklists.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Vincule ao menos um checklist ativo no cadastro deste IBC antes de concluir.
        </p>
      ) : (
        <ul className="mt-3 space-y-1 text-sm">
          {item.checklists.map((checklist) => (
            <li key={checklist.checklistModeloId} className="flex items-center justify-between gap-3">
              <span className="text-foreground">{checklist.nome}</span>
              <span className={checklist.inspecionada ? "text-primary" : "text-muted-foreground"}>
                {checklist.inspecionada ? "Inspecionado" : "Pendente"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
