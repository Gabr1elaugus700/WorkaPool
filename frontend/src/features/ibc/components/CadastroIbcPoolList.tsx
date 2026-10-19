import { useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatIsoDateLabel } from "@/utils/formatDate";
import type { IbcCadastroDTO, IbcProdutoDTO } from "../types/ibcCadastro.types";
import { filterCadastroIbcPool, type IbcPoolSituacao } from "../utils/filterCadastroIbcPool";
import { ibcCadastroLabels } from "../utils/ibcCadastroLabels";
import { podeInspecionarIbc } from "../utils/ibcInspecao.utils";
import { isIbcNaoHomologado, isIbcSubstituido } from "../utils/ibcMudanca.utils";
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

const CUSTODIA: Record<IbcCadastroDTO["custodia"], string> = {
  PATIO: "Pátio",
  EM_VIAGEM: "Em viagem",
  ENTRADA: "Entrada no pátio",
  CLIENTE: "No cliente",
};

const FIELD =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:w-44";
const HEAD = ["Identificador", "Produto", "Situação", "Custódia", "Limite"] as const;
type Acao = { label: string; disabled?: boolean; run: () => void };

type Props = {
  items: IbcCadastroDTO[];
  produtos: IbcProdutoDTO[];
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
    isIbcNaoHomologado(ibc) ? "Não homologado" : null,
    ibc.baixadoEm ? "Baixado" : null,
    isIbcSubstituido(ibc) ? "Substituído" : null,
  ].filter((label): label is string => label !== null);
}

function acoesDaLinha(ibc: IbcCadastroDTO, props: Props): Acao[] {
  const write = props.canWrite && !isIbcSubstituido(ibc);
  const opcionais: Array<Acao | null> = [
    write && !isIbcNaoHomologado(ibc)
      ? { label: "Converter para não homologado", disabled: props.actionsDisabled, run: () => props.onConverter(ibc) }
      : null,
    write
      ? { label: "Mudar produto", disabled: props.actionsDisabled, run: () => props.onMudarProduto(ibc) }
      : null,
    write ? { label: "Checklists", run: () => props.onGerenciarChecklists(ibc) } : null,
  ];
  return [
    ...opcionais.filter((acao): acao is Acao => acao !== null),
    { label: "Inspeções", run: () => props.onVerInspecoes(ibc) },
    { label: "Histórico", run: () => props.onVerHistorico(ibc) },
  ];
}

export default function CadastroIbcPoolList(props: Props) {
  const { items, produtos, canWrite } = props;
  const [busca, setBusca] = useState("");
  const [situacao, setSituacao] = useState<IbcPoolSituacao>("todas");
  const [produtoId, setProdutoId] = useState("");
  const filtrados = filterCadastroIbcPool(items, { busca, situacao, produtoId });

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          <Input
            aria-label="Identificador"
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
            placeholder="Buscar identificador"
            className="sm:max-w-xs"
          />
          <select
            aria-label="Situação"
            className={FIELD}
            value={situacao}
            onChange={(event) => setSituacao(event.target.value as IbcPoolSituacao)}
          >
            {SITUACOES.map((option) => (
              <option key={option.id} value={option.id}>{option.label}</option>
            ))}
          </select>
          <select
            aria-label="Produto"
            className={FIELD}
            value={produtoId}
            onChange={(event) => setProdutoId(event.target.value)}
          >
            <option value="">Todos os produtos</option>
            {produtos.map((produto) => (
              <option key={produto.id} value={produto.id}>{produto.nome}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="ibc-incluir-historico"
            checked={props.incluirHistorico}
            onCheckedChange={(value) => props.onIncluirHistoricoChange(value === true)}
          />
          <Label htmlFor="ibc-incluir-historico" className="text-sm font-normal">
            Incluir baixados e substituídos
          </Label>
        </div>
      </div>
      <p className="text-xs tabular-nums text-muted-foreground">{filtrados.length} de {items.length} containers</p>
      {items.length === 0 ? (
        <IbcStatusContent status="empty" title={props.emptyMessage} nextStep={props.emptyNextStep} />
      ) : filtrados.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum container com esses filtros.</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                {HEAD.map((label) => (
                  <TableHead key={label} className="h-9 px-3">{label}</TableHead>
                ))}
                <TableHead className="h-9 px-3 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtrados.map((ibc) => {
                const extras = marcas(ibc);
                const produto = produtos.find((item) => item.id === ibc.produtoId)?.nome ?? "—";
                return (
                  <TableRow key={ibc.id}>
                    <TableCell className="px-3 py-2 font-medium tabular-nums">{ibc.identificador}</TableCell>
                    <TableCell className="px-3 py-2">{produto}</TableCell>
                    <TableCell className="px-3 py-2">
                      <Badge variant={ibc.aptidao === "APTO" ? "default" : "secondary"}>{ibcCadastroLabels.aptidao[ibc.aptidao]}</Badge>
                      {extras.length > 0 ? <span className="ml-1.5 text-xs text-muted-foreground">{extras.join(" · ")}</span> : null}
                    </TableCell>
                    <TableCell className="px-3 py-2 text-muted-foreground">{CUSTODIA[ibc.custodia]}</TableCell>
                    <TableCell className="px-3 py-2 tabular-nums">{formatDataLimite(ibc.dataLimite)}</TableCell>
                    <TableCell className="px-3 py-2 text-right">
                      {canWrite && podeInspecionarIbc(ibc) ? (
                        <Button type="button" variant="outline" size="sm" className="mr-1" onClick={() => props.onInspecionar(ibc)}>
                          Inspecionar
                        </Button>
                      ) : null}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button type="button" variant="ghost" size="icon" aria-label={`Mais ações de ${ibc.identificador}`}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {acoesDaLinha(ibc, props).map((acao) => (
                            <DropdownMenuItem key={acao.label} disabled={acao.disabled} onSelect={acao.run}>
                              {acao.label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
