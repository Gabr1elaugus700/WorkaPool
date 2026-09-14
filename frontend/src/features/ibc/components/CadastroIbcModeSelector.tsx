import { Label } from "@/components/ui/label";

export type CadastroIbcMode = "unitario" | "lote";

type Props = {
  mode: CadastroIbcMode;
  disabled?: boolean;
  onChange: (mode: CadastroIbcMode) => void;
};

export default function CadastroIbcModeSelector({
  mode,
  disabled = false,
  onChange,
}: Props) {
  return (
    <fieldset className="mb-4 space-y-2" disabled={disabled}>
      <legend className="text-xs font-medium text-muted-foreground">
        Tipo de cadastro
      </legend>
      <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="cadastro-ibc-mode"
            value="unitario"
            checked={mode === "unitario"}
            onChange={() => onChange("unitario")}
            className="h-4 w-4 accent-primary"
          />
          <Label className="font-normal">Cadastro unitário</Label>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="cadastro-ibc-mode"
            value="lote"
            checked={mode === "lote"}
            onChange={() => onChange("lote")}
            className="h-4 w-4 accent-primary"
          />
          <Label className="font-normal">Cadastro em Lote</Label>
        </label>
      </div>
    </fieldset>
  );
}
