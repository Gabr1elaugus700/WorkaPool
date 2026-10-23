import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { IbcProdutoGrupoConfig, IbcProdutoUniversalConfig, SaveIbcProdutoConfigInput } from "../services/ibcProdutoConfigService";
import { ibcProdutoConfigForm } from "../utils/ibcProdutoConfigForm";

export type IbcProdutoConfigEdicao =
  | { tipo: "universal"; item: IbcProdutoUniversalConfig }
  | { tipo: "grupo"; item: IbcProdutoGrupoConfig };

type Props = {
  alvo: IbcProdutoConfigEdicao;
  erro: string | null;
  saving: boolean;
  onClose: () => void;
  onSave: (input: SaveIbcProdutoConfigInput) => Promise<void>;
};

const TRAVA = "Sigla e cor não podem mudar: já existe container usando esta configuração";
const campoCor = "h-10 w-14 cursor-pointer rounded-md border border-input bg-background p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

export default function IbcProdutoConfigModal({ alvo, erro, saving, onClose, onSave }: Props) {
  const grupo = alvo.tipo === "grupo" ? alvo.item : null;
  const travado = alvo.item.emUso;
  const [sigla, setSigla] = useState(grupo?.sigla ?? "");
  const [corHex, setCorHex] = useState(alvo.item.corHex ?? "");
  const pronto = ibcProdutoConfigForm.podeGravar(travado, grupo != null, sigla, corHex);
  const nome = grupo ? grupo.grupoDescricao?.trim() || grupo.grupoCodigo : "Universal";
  const amostra = ibcProdutoConfigForm.corDoSeletor(corHex);
  const bloqueio = travado ? "placa-travada" : undefined;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!pronto || saving) return;
    void onSave(grupo ? { tipo: "grupo", grupoCodigo: grupo.grupoCodigo, sigla, corHex } : { tipo: "universal", corHex });
  };

  return (
    <form onSubmit={submit} className="space-y-4" aria-labelledby="placa-titulo">
      <div className="space-y-1.5">
        <h2 id="placa-titulo" className="text-lg font-semibold leading-none tracking-tight text-foreground">Placa · {nome}</h2>
        <p id="placa-descricao" className="text-sm text-muted-foreground">
          {grupo ? `Grupo ${grupo.grupoCodigo}. A sigla entra no identificador HM e NH.` : "Container lavado entre usos. A placa universal não tem sigla."}
        </p>
      </div>
      {grupo && !grupo.encontradoNoSapiens ? <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Não encontrado no Sapiens</p> : null}
      {travado ? <p id="placa-travada" className="text-sm text-foreground">{TRAVA}</p> : null}
      <div className="flex items-end gap-3">
        <span className="h-16 w-24 shrink-0 rounded-md border border-border shadow-sm" style={{ backgroundColor: corHex ? amostra : "transparent" }} role="img" aria-label={corHex ? `Amostra ${amostra}` : "Cor ainda não escolhida"} />
        <div className="space-y-1.5">
          <Label htmlFor="placa-cor" className="text-xs">Cor da placa</Label>
          <input id="placa-cor" type="color" value={amostra} disabled={travado || saving} aria-describedby={bloqueio} onChange={(event) => setCorHex(event.target.value.toUpperCase())} className={campoCor} />
        </div>
        <div className="min-w-0 flex-1 space-y-1.5">
          <Label htmlFor="placa-hex" className="text-xs">Hex</Label>
          <Input id="placa-hex" value={corHex} maxLength={7} disabled={travado || saving} placeholder="#RRGGBB" onChange={(event) => setCorHex(ibcProdutoConfigForm.corDe(event.target.value))} className="font-medium uppercase tabular-nums" />
        </div>
      </div>
      {grupo ? (
        <div className="space-y-1.5">
          <Label htmlFor="placa-sigla" className="text-xs">Sigla (1–2 letras)</Label>
          <Input id="placa-sigla" value={sigla} maxLength={2} disabled={travado || saving} placeholder="Ex.: S" aria-describedby={bloqueio} onChange={(event) => setSigla(ibcProdutoConfigForm.siglaDe(event.target.value))} className="max-w-[6rem] font-medium uppercase tabular-nums" />
        </div>
      ) : null}
      {erro ? <p role="alert" className="text-sm text-destructive">{erro}</p> : null}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
        <Button type="submit" disabled={!pronto || saving}>{saving ? "Salvando…" : "Salvar placa"}</Button>
      </div>
    </form>
  );
}
