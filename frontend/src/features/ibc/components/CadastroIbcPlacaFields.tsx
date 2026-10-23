import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ibcPlacaCadastro, type GrupoPlacaOpcao } from "../utils/ibcPlacaCadastro";
import IbcPlacaAmostra from "./IbcPlacaAmostra";
import IbcSegmentedControl from "./IbcSegmentedControl";

const MODOS = [{ id: "HM", label: "Homologado" }, { id: "NH", label: "Não homologado" }] as const;
const UNIVERSAL = "__universal__";

type Props = {
  id: string;
  grupos: readonly GrupoPlacaOpcao[];
  universalCorHex: string | null;
  homologado: boolean;
  grupoCodigo: string;
  disabled?: boolean;
  onHomologado: (homologado: boolean) => void;
  onGrupo: (grupoCodigo: string) => void;
};

export default function CadastroIbcPlacaFields(props: Props) {
  const { id, grupos, universalCorHex, homologado, grupoCodigo, disabled = false } = props;
  const escolha = ibcPlacaCadastro.escolha(homologado, grupoCodigo, grupos, universalCorHex);
  const aviso = disabled ? null : ibcPlacaCadastro.aviso(homologado, grupoCodigo, grupos, universalCorHex);
  const item = (cor: string | null, rotulo: string) => (
    <span className="inline-flex items-center gap-2"><IbcPlacaAmostra corHex={cor} />{rotulo}</span>
  );
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-foreground">Homologação</p>
        <IbcSegmentedControl
          ariaLabel="Homologação do container"
          options={MODOS}
          value={homologado ? "HM" : "NH"}
          disabled={disabled}
          onChange={(modo) => props.onHomologado(modo === "HM")}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={id} className="text-xs">Grupo</Label>
        <Select
          value={grupoCodigo || (homologado ? undefined : UNIVERSAL)}
          onValueChange={(value) => props.onGrupo(value === UNIVERSAL ? "" : value)}
          disabled={disabled}
        >
          <SelectTrigger id={id} aria-invalid={aviso != null} aria-describedby={aviso ? `${id}-aviso` : undefined}>
            <SelectValue placeholder="Selecione o grupo" />
          </SelectTrigger>
          <SelectContent>
            {homologado ? null : <SelectItem value={UNIVERSAL}>{item(universalCorHex, ibcPlacaCadastro.universalOpcao)}</SelectItem>}
            {grupos.map((grupo) => (
              <SelectItem key={grupo.grupoCodigo} value={grupo.grupoCodigo}>{item(grupo.corHex, `${grupo.nome} (${grupo.sigla})`)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {aviso ? <p id={`${id}-aviso`} className="text-xs text-destructive">{aviso}</p> : null}
      </div>
      <div className="flex items-center gap-3 rounded-md border border-border bg-muted/40 px-3 py-2.5" aria-live="polite">
        <IbcPlacaAmostra corHex={escolha?.corHex} />
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">Prefixo</p>
          <p className="font-medium tabular-nums text-foreground">{escolha?.prefixo ?? "—"}</p>
          <p className="truncate text-xs text-muted-foreground">{escolha?.rotulo ?? "Escolha o grupo para ver a placa."}</p>
        </div>
      </div>
    </div>
  );
}
