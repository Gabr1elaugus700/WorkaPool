import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { formatCount } from "@/utils/formatCount";
import { paginate } from "@/utils/paginate";
import type { IbcChecklistItemDTO } from "../types/ibcChecklist.types";
import {
  labelBloqueante,
  labelChecklistItemTipo,
  labelRespostaEsperada,
} from "../utils/ibcChecklistItemDisplay.utils";
import IbcStatusContent from "./IbcStatusContent";

const PAGE_SIZE = 10;

const HEAD = ["Descrição", "Tipo", "Regra", "Situação"] as const;

type Props = {
  itens: IbcChecklistItemDTO[];
  saving: boolean;
  onEdit: (item: IbcChecklistItemDTO) => void;
  onToggleAtivo: (item: IbcChecklistItemDTO) => void;
};

function regraCell(item: IbcChecklistItemDTO): string {
  if (item.tipo === "SIM_NAO") {
    const esperada = item.respostaEsperada
      ? labelRespostaEsperada(item.respostaEsperada)
      : "—";
    const bloqueante =
      item.bloqueante === null || item.bloqueante === undefined
        ? "—"
        : labelBloqueante(item.bloqueante);
    return `Esperado: ${esperada} · Bloqueante: ${bloqueante}`;
  }
  return item.critico ? "Crítico" : "—";
}

function regraIsCriticoBadge(item: IbcChecklistItemDTO): boolean {
  return item.tipo === "NUMERICO" && item.critico;
}

export default function IbcChecklistItensTabela({ itens, saving, onEdit, onToggleAtivo }: Props) {
  const [requestedPage, setRequestedPage] = useState(1);
  const { pageItems, page, totalPages } = paginate(itens, requestedPage, PAGE_SIZE);

  if (itens.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card px-6 py-10 shadow-sm">
        <IbcStatusContent
          status="empty"
          title="Nenhum item cadastrado."
          nextStep="Cadastre o primeiro item de inspeção no formulário acima."
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              {HEAD.map((label) => (
                <TableHead key={label} className="h-9 px-3 text-xs font-medium">
                  {label}
                </TableHead>
              ))}
              <TableHead className="h-9 px-3 text-right text-xs font-medium">
                <span className="sr-only">Ações</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell className={cn("px-3 py-2", !item.ativo && "text-muted-foreground line-through")}>
                  {item.descricao}
                </TableCell>
                <TableCell className="px-3 py-2 text-sm">{labelChecklistItemTipo(item.tipo)}</TableCell>
                <TableCell className="px-3 py-2 text-sm">
                  {regraIsCriticoBadge(item) ? (
                    <span className="inline-flex items-center rounded-full border border-destructive/30 bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                      Crítico
                    </span>
                  ) : (
                    <span className="text-muted-foreground">{regraCell(item)}</span>
                  )}
                </TableCell>
                <TableCell className="px-3 py-2 text-muted-foreground">{item.ativo ? "Ativo" : "Inativo"}</TableCell>
                <TableCell className="px-3 py-2">
                  <div className="flex items-center justify-end gap-1">
                    <Button type="button" variant="ghost" size="sm" disabled={saving} onClick={() => onEdit(item)}>
                      Editar
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={saving}
                      onClick={() => onToggleAtivo(item)}
                    >
                      {item.ativo ? "Desativar" : "Ativar"}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {totalPages > 1 ? (
        <footer className="flex flex-col gap-2 text-sm md:flex-row md:items-center md:justify-between">
          <span className="tabular-nums text-muted-foreground" aria-live="polite">
            {`Página ${page} de ${totalPages} · ${formatCount(itens.length, "item", "itens")}`}
          </span>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={page <= 1}
              onClick={() => setRequestedPage(page - 1)}
            >
              Anterior
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => setRequestedPage(page + 1)}
            >
              Próxima
            </Button>
          </div>
        </footer>
      ) : null}
    </div>
  );
}