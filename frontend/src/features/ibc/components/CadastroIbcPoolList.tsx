import { Badge } from "@/components/ui/badge";
import type { IbcCadastroDTO } from "../types/ibcCadastro.types";
import { ibcCadastroLabels } from "../utils/ibcCadastroLabels";

type Props = {
  items: IbcCadastroDTO[];
};

function formatDataLimite(value: string | null): string {
  if (!value) return "—";
  return value.slice(0, 10);
}

export default function CadastroIbcPoolList({ items }: Props) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhum IBC ativo no pool.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-border">
      {items.map((ibc) => (
        <li
          key={ibc.id}
          className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <span className="font-medium">{ibc.identificador}</span>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Badge
              variant={ibc.aptidao === "APTO" ? "default" : "secondary"}
              className="text-[10px]"
            >
              {ibcCadastroLabels.aptidao[ibc.aptidao]}
            </Badge>
            {ibc.motivoInaptidao ? (
              <Badge variant="outline" className="text-[10px]">
                {ibcCadastroLabels.motivoInaptidao[ibc.motivoInaptidao]}
              </Badge>
            ) : null}
            <span>limite {formatDataLimite(ibc.dataLimite)}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}
