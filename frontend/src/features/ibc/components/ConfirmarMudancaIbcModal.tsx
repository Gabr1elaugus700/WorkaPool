import { useState, type FormEvent } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { ListaIbcProdutoConfig } from "../services/ibcProdutoConfigService";
import type { ChangeIbcProdutoInput, ConvertIbcInput, IbcCadastroDTO, IbcConversaoDestino } from "../types/ibcCadastro.types";
import IbcSegmentedControl from "./IbcSegmentedControl";
import {
  IBC_OBSERVACAO_MAX,
  buildConversaoInput,
  buildIbcMudancaConfirmacao,
  buildMudancaProdutoInput,
  corDePlaca,
  listarDestinosPlaca,
  previewConversaoPrefixo,
  previewMudancaProdutoPrefixo,
  siglaDoPrefixoHomologado,
  type IbcDestinoPlaca,
} from "../utils/ibcMudanca.utils";

export type IbcMudancaModo = "conversion" | "product_change";

type Confirmacao =
  | { tipo: "conversion"; input: ConvertIbcInput }
  | { tipo: "product_change"; input: ChangeIbcProdutoInput };

type Props = {
  ibc: IbcCadastroDTO;
  modo: IbcMudancaModo;
  config: ListaIbcProdutoConfig | null;
  configCarregando: boolean;
  configErro: string | null;
  submitting: boolean;
  onClose: () => void;
  onConfirm: (acao: Confirmacao) => Promise<void>;
};

const COPY = {
  conversion: {
    title: "Converter para não homologado",
    action: "Converter",
    pending: "Convertendo…",
    description: "O homologado vira não homologado. O registro atual permanece no histórico.",
  },
  product_change: {
    title: "Mudar produto do IBC",
    action: "Mudar produto",
    pending: "Mudando produto…",
    description: "Escolha outro grupo ou o universal. O registro atual permanece no histórico.",
  },
} as const;

const DESTINOS = [
  { id: "manter_grupo", label: "Manter produto" },
  { id: "universal", label: "Universal" },
] as const satisfies readonly { id: IbcConversaoDestino; label: string }[];

function Amostra({ cor }: { cor: string }) {
  return <span className="inline-block h-4 w-6 shrink-0 rounded-sm border border-border shadow-sm" style={{ backgroundColor: cor }} role="img" aria-label={`Cor ${cor}`} />;
}

export default function ConfirmarMudancaIbcModal({
  ibc,
  modo,
  config,
  configCarregando,
  configErro,
  submitting,
  onClose,
  onConfirm,
}: Props) {
  const [destino, setDestino] = useState<IbcConversaoDestino>("manter_grupo");
  const [produtoId, setProdutoId] = useState("");
  const [grupoCodigo, setGrupoCodigo] = useState("");
  const [observacao, setObservacao] = useState("");
  const [confirmado, setConfirmado] = useState(false);

  const destinos = config ? listarDestinosPlaca(config, ibc.produtoId) : [];
  const grupos = destinos.filter((item) => item.grupoCodigo);
  const produtoDestino = destinos.find((item) => item.produtoId === produtoId) ?? null;
  const grupoDestino = grupos.find((item) => item.grupoCodigo === grupoCodigo) ?? null;
  const legado = modo === "conversion" && siglaDoPrefixoHomologado(ibc) == null;
  const precisaGrupo = legado && destino === "manter_grupo";
  const mostraSeletor = modo === "product_change" || precisaGrupo;
  const opcoes = modo === "product_change" ? destinos : grupos;
  const valor = modo === "product_change" ? produtoId : grupoCodigo;
  const prefixoDestino =
    modo === "conversion"
      ? previewConversaoPrefixo(ibc, destino, grupoDestino?.sigla ?? null)
      : produtoDestino
        ? previewMudancaProdutoPrefixo(produtoDestino.sigla)
        : null;
  const corNova =
    modo === "product_change"
      ? produtoDestino?.corHex ?? null
      : destino === "universal"
        ? corDePlaca(config?.universal.corHex)
        : grupoDestino?.corHex ?? corAtual(config, ibc.produtoId);
  const universalSemPlaca = modo === "conversion" && destino === "universal" && config != null && !config.universal.configurado;
  const confirmacao = buildIbcMudancaConfirmacao(confirmado, observacao);
  const listaPronta = !mostraSeletor || (!configCarregando && !configErro && opcoes.length > 0 && (modo === "conversion" ? grupoDestino != null : produtoDestino != null));
  const canSubmit = confirmacao != null && prefixoDestino != null && listaPronta && !universalSemPlaca && !submitting;

  const handleConfirm = async () => {
    if (!canSubmit || !confirmacao) return;
    if (modo === "product_change" && produtoDestino) {
      const input = buildMudancaProdutoInput(true, observacao, produtoDestino.produtoId);
      if (input) await onConfirm({ tipo: "product_change", input });
      return;
    }
    const input = buildConversaoInput(true, observacao, destino, precisaGrupo ? grupoDestino?.grupoCodigo ?? null : null);
    if (input) await onConfirm({ tipo: "conversion", input });
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    void handleConfirm();
  };

  return (
    <form className="space-y-4" aria-labelledby="ibc-mudanca-titulo" onSubmit={submit}>
      <div className="space-y-1.5">
        <h2 id="ibc-mudanca-titulo" className="pr-8 text-lg font-semibold leading-none tracking-tight text-foreground">
          {COPY[modo].title}
        </h2>
        <p id="ibc-mudanca-descricao" className="text-sm text-muted-foreground">{COPY[modo].description}</p>
      </div>

      <div className="space-y-4">
          <p className="rounded-md border border-border bg-muted/40 px-3 py-2.5 text-sm text-foreground">
            O número muda. A placa atual deixa de valer e precisa ser trocada por uma placa nova.
          </p>
          {modo === "conversion" ? (
            <div className="space-y-1.5">
              <Label className="text-xs">Destino</Label>
              <IbcSegmentedControl ariaLabel="Destino da conversão" options={DESTINOS} value={destino} disabled={submitting} onChange={setDestino} />
              {legado && destino === "manter_grupo" ? <p className="text-sm text-muted-foreground">Este container não tem produto. Escolha o grupo da placa nova.</p> : null}
              {universalSemPlaca ? <p className="text-sm text-destructive" role="alert">O universal ainda não tem placa. Grave a cor em Produtos.</p> : null}
            </div>
          ) : null}
          {mostraSeletor ? (
            <div className="space-y-1.5">
              <Label htmlFor="ibc-mudanca-destino" className="text-xs">{modo === "product_change" ? "Novo produto" : "Grupo do produto"}</Label>
              {configCarregando ? <p className="text-sm text-muted-foreground">Carregando produtos…</p> : configErro ? (
                <p className="text-sm text-destructive" role="alert">{configErro}</p>
              ) : opcoes.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum destino configurado. Grave a placa em Produtos antes de continuar.</p>
              ) : (
                <Select value={valor || undefined} onValueChange={modo === "product_change" ? setProdutoId : setGrupoCodigo} disabled={submitting}>
                  <SelectTrigger id="ibc-mudanca-destino">
                    <SelectValue placeholder={modo === "product_change" ? "Grupo ou universal" : "Selecione o grupo"} />
                  </SelectTrigger>
                  <SelectContent>
                    {opcoes.map((opcao) => (
                      <SelectItem key={opcao.produtoId} value={chaveDaOpcao(opcao, modo)}>
                        <span className="inline-flex items-center gap-2"><Amostra cor={opcao.corHex} />{opcao.rotulo}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          ) : null}
          <div className="flex flex-wrap items-center gap-3 rounded-md border bg-muted/40 px-3 py-2.5 text-sm">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Placa atual</p>
              <p className="font-medium tabular-nums">{ibc.identificador}</p>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Prefixo novo</p>
              <p className="flex items-center gap-2 font-medium tabular-nums">
                {corNova ? <Amostra cor={corNova} /> : null}
                {prefixoDestino ?? (mostraSeletor ? "Escolha o destino" : "Não aplicável")}
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between">
              <Label htmlFor="ibc-mudanca-observacao" className="text-xs">
                Observação (opcional)
              </Label>
              <span className="text-xs tabular-nums text-muted-foreground">
                {observacao.length}/{IBC_OBSERVACAO_MAX}
              </span>
            </div>
            <Textarea
              id="ibc-mudanca-observacao"
              value={observacao}
              onChange={(event) => setObservacao(event.target.value)}
              maxLength={IBC_OBSERVACAO_MAX}
              rows={3}
              disabled={submitting}
              placeholder="Ex.: avaria visual encontrada na inspeção"
            />
          </div>

          <div className="flex items-start gap-2">
            <Checkbox
              id="ibc-mudanca-confirmado"
              checked={confirmado}
              onCheckedChange={(checked) => setConfirmado(checked === true)}
              disabled={submitting}
              className="mt-0.5"
            />
            <Label htmlFor="ibc-mudanca-confirmado" className="text-sm font-normal leading-snug">
              Confirmo a criação do novo registro e o vínculo com {ibc.identificador}.
            </Label>
          </div>
        </div>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={!canSubmit}>
          {submitting ? COPY[modo].pending : COPY[modo].action}
        </Button>
      </div>
    </form>
  );
}

function chaveDaOpcao(opcao: IbcDestinoPlaca, modo: IbcMudancaModo): string {
  return modo === "product_change" ? opcao.produtoId : opcao.grupoCodigo ?? opcao.produtoId;
}

function corAtual(config: ListaIbcProdutoConfig | null, produtoId: string | null | undefined): string | null {
  if (!config || !produtoId) return null;
  if (config.universal.id === produtoId) return corDePlaca(config.universal.corHex);
  return corDePlaca(config.grupos.find((grupo) => grupo.id === produtoId)?.corHex);
}
