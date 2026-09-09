import type { IbcCadastroDTO } from "../types/ibcCadastro.types";

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
          className="flex flex-col gap-0.5 py-3 sm:flex-row sm:items-baseline sm:justify-between"
        >
          <span className="font-medium">{ibc.identificador}</span>
          <span className="text-sm text-muted-foreground">
            {ibc.aptidao}
            {ibc.motivoInaptidao ? ` · ${ibc.motivoInaptidao}` : ""}
            {" · limite "}
            {formatDataLimite(ibc.dataLimite)}
          </span>
        </li>
      ))}
    </ul>
  );
}
