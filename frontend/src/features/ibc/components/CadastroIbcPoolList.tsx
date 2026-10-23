import { useState } from "react";
import { MoreHorizontal, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { formatIsoDateLabel } from "@/utils/formatDate";
import type { IbcCadastroDTO } from "../types/ibcCadastro.types";
import { filterCadastroIbcPool, type IbcPoolSituacao } from "../utils/filterCadastroIbcPool";
import { ibcCadastroLabels } from "../utils/ibcCadastroLabels";
import { podeInspecionarIbc } from "../utils/ibcInspecao.utils";
import { acaoMudancaDisponivel, isIbcSubstituido } from "../utils/ibcMudanca.utils";
import { ibcPlacaCadastro, type NomeProdutoIbc } from "../utils/ibcPlacaCadastro";
import CadastroIbcDetalhe from "./CadastroIbcDetalhe";
import IbcPlacaAmostra from "./IbcPlacaAmostra";
import IbcStatusContent from "./IbcStatusContent";

const SITUACOES: readonly { id: IbcPoolSituacao; label: string }[] = [
  { id: "todas", label: "Todas as situações" },
  { id: "apto", label: "Apto" },
  { id: "inapto", label: "Inapto" },
  { id: "sem_inspecao", label: "Sem inspeção" },
  { id: "nao_homologado", label: "Não homologado" },
  { id: "baixado", label: "Baixado" },
  { id: "substituido", label: "Substituído" },
];

const TODOS_PRODUTOS = "todos";

const CUSTODIA: Record<IbcCadastroDTO["custodia"], string> = {
  PATIO: "Pátio",
  EM_VIAGEM: "Em viagem",
  ENTRADA: "Entrada no pátio",
  CLIENTE: "No cliente",
};

const APTIDAO_CHIP: Record<IbcCadastroDTO["aptidao"], string> = {
  APTO: "border-primary/30 bg-primary/10 text-primary",
  INAPTO: "border-destructive/30 bg-destructive/10 text-destructive",
};

const HEAD = ["Identificador", "Produto", "Situação", "Custódia", "Limite"] as const;

type Acao = { label: string; disabled?: boolean; run: () => void };

type Props = {
  items: IbcCadastroDTO[];
  produtos: readonly NomeProdutoIbc[];
  canWrite: boolean;
  incluirHistorico: boolean;
  onIncluirHistoricoChange: (value: boolean) => void;
  emptyMessage: string;
  emptyNextStep: string;
  actionsDisabled?: boolean;
  onConverter: (ibc: IbcCadastroDTO) => void;
  onMudarProduto: (ibc: IbcCadastroDTO) => void;
  onVerHistorico: (ibc: IbcCadastroDTO) => void;
  onGerenciarChecklists: (ibc: IbcCadastroDTO) => void;
  onInspecionar: (ibc: IbcCadastroDTO) => void;
  onVerInspecoes: (ibc: IbcCadastroDTO) => void;
};

function formatDataLimite(value: string | null): string {
  return value ? formatIsoDateLabel(value.slice(0, 10)) : "—";
}

function marcas(ibc: IbcCadastroDTO): string[] {
  return [
    ibc.motivoInaptidao ? ibcCadastroLabels.motivoInaptidao[ibc.motivoInaptidao] : null,
    ibc.primeiraInspecaoEm == null ? ibcCadastroLabels.alertaMotivo.SEM_INSPECAO : null,
    ibcPlacaCadastro.naoHomologado(ibc) ? "Não homologado" : null,
    ibc.baixadoEm ? "Baixado" : null,
    isIbcSubstituido(ibc) ? "Substituído" : null,
  ].filter((label): label is string => label !== null);
}

function acoesDeEscrita(ibc: IbcCadastroDTO, props: Props): Acao[] {
  if (!props.canWrite || isIbcSubstituido(ibc)) return [];
  const acoes: Acao[] = [];
  const mudanca = acaoMudancaDisponivel(ibc);
  if (mudanca === "converter") {
    acoes.push({ label: "Converter para não homologado", disabled: props.actionsDisabled, run: () => props.onConverter(ibc) });
  }
  if (mudanca === "mudar_produto") {
    acoes.push({ label: "Mudar produto", disabled: props.actionsDisabled, run: () => props.onMudarProduto(ibc) });
  }
  acoes.push({ label: "Checklists", run: () => props.onGerenciarChecklists(ibc) });
  return acoes;
}

function acoesDeConsulta(ibc: IbcCadastroDTO, props: Props): Acao[] {
  return [
    { label: "Inspeções", run: () => props.onVerInspecoes(ibc) },
    { label: "Histórico", run: () => props.onVerHistorico(ibc) },
  ];
}

function AcaoItens({ acoes }: { acoes: Acao[] }) {
  return acoes.map((acao) => (
    <DropdownMenuItem key={acao.label} disabled={acao.disabled} onSelect={acao.run}>
      {acao.label}
    </DropdownMenuItem>
  ));
}

export default function CadastroIbcPoolList(props: Props) {
  const { items, produtos, canWrite } = props;
  const [busca, setBusca] = useState("");
  const [situacao, setSituacao] = useState<IbcPoolSituacao>("todas");
  const [produtoId, setProdutoId] = useState(TODOS_PRODUTOS);
  const [detalhe, setDetalhe] = useState<IbcCadastroDTO | null>(null);
  const filtrados = filterCadastroIbcPool(items, {
    busca,
    situacao,
    produtoId: produtoId === TODOS_PRODUTOS ? "" : produtoId,
  });
  const produtoNome = new Map(produtos.map((produto) => [produto.id, produto.nome]));

  const limparFiltros = () => {
    setBusca("");
    setSituacao("todas");
    setProdutoId(TODOS_PRODUTOS);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative lg:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            aria-label="Buscar identificador"
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
            placeholder="Buscar identificador"
            className="pl-9"
          />
        </div>
        <Select value={situacao} onValueChange={(value) => setSituacao(value as IbcPoolSituacao)}>
          <SelectTrigger aria-label="Situação" className="lg:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SITUACOES.map((option) => (
              <SelectItem key={option.id} value={option.id}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={produtoId} onValueChange={setProdutoId}>
          <SelectTrigger aria-label="Produto" className="lg:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODOS_PRODUTOS}>Todos os produtos</SelectItem>
            {produtos.map((produto) => (
              <SelectItem key={produto.id} value={produto.id}>
                {produto.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2 lg:ml-2">
          <Checkbox
            id="ibc-incluir-historico"
            checked={props.incluirHistorico}
            onCheckedChange={(value) => props.onIncluirHistoricoChange(value === true)}
          />
          <Label htmlFor="ibc-incluir-historico" className="text-sm font-normal">
            Incluir baixados e substituídos
          </Label>
        </div>
        <p className="text-xs tabular-nums text-muted-foreground lg:ml-auto" aria-live="polite">
          {filtrados.length} de {items.length} containers
        </p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-lg border border-border bg-card px-6 py-10 shadow-sm">
          <IbcStatusContent status="empty" title={props.emptyMessage} nextStep={props.emptyNextStep} />
        </div>
      ) : filtrados.length === 0 ? (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card px-6 py-8 text-sm shadow-sm">
          <p className="text-muted-foreground">Nenhum container com esses filtros.</p>
          <Button type="button" variant="outline" size="sm" onClick={limparFiltros}>
            Limpar filtros
          </Button>
        </div>
      ) : (
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
              {filtrados.map((ibc) => {
                const extras = marcas(ibc);
                const escrita = acoesDeEscrita(ibc, props);
                return (
                  <TableRow key={ibc.id}>
                    <TableCell className="px-3 py-2">
                      <button
                        type="button"
                        className="inline-flex items-center gap-2 rounded-sm font-medium tabular-nums text-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        aria-label={`Detalhe de ${ibc.identificador}`}
                        onClick={() => setDetalhe(ibc)}
                      >
                        <IbcPlacaAmostra corHex={ibc.corHex} />
                        {ibc.identificador}
                      </button>
                    </TableCell>
                    <TableCell className="px-3 py-2">{ibc.universal ? "Universal" : (produtoNome.get(ibc.produtoId ?? "") ?? "—")}</TableCell>
                    <TableCell className="px-3 py-2">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                            APTIDAO_CHIP[ibc.aptidao],
                          )}
                        >
                          {ibcCadastroLabels.aptidao[ibc.aptidao]}
                        </span>
                        {extras.length > 0 ? (
                          <span className="text-xs text-muted-foreground">{extras.join(" · ")}</span>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="px-3 py-2 text-muted-foreground">{CUSTODIA[ibc.custodia]}</TableCell>
                    <TableCell className="px-3 py-2 tabular-nums">{formatDataLimite(ibc.dataLimite)}</TableCell>
                    <TableCell className="px-3 py-2">
                      <div className="flex items-center justify-end gap-1">
                        {canWrite && podeInspecionarIbc(ibc) ? (
                          <Button type="button" variant="outline" size="sm" onClick={() => props.onInspecionar(ibc)}>
                            Inspecionar
                          </Button>
                        ) : null}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              aria-label={`Mais ações de ${ibc.identificador}`}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="min-w-[14rem]">
                            <AcaoItens acoes={escrita} />
                            {escrita.length > 0 ? <DropdownMenuSeparator /> : null}
                            <AcaoItens acoes={acoesDeConsulta(ibc, props)} />
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
      {detalhe ? (
        <Sheet open onOpenChange={(open) => !open && setDetalhe(null)}>
          <SheetContent>
            <CadastroIbcDetalhe ibc={detalhe} produto={produtoNome.get(detalhe.produtoId ?? "") ?? null} />
          </SheetContent>
        </Sheet>
      ) : null}
    </div>
  );
}
