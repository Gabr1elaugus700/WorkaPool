import { AlertTriangle } from "lucide-react";
import type { LoteSaldoWarningDTO } from "../types/ibcCadastro.types";

type Props = {
  warning: LoteSaldoWarningDTO;
};

export default function CadastroIbcLoteWarningBanner({ warning }: Props) {
  const message =
    warning.code === "OVER_SALDO"
      ? `Aviso: vivos no pool (${warning.vivos}) + lote (${warning.quantidade}) ultrapassam o saldo ERP (${warning.saldo}). O cadastro foi concluído mesmo assim.`
      : `Aviso: saldo ERP indisponível no momento. O lote (${warning.quantidade} IBC) foi cadastrado sem comparação de estoque fiscal.`;

  return (
    <div
      role="status"
      className="mt-4 flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-950 dark:text-amber-100"
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <p>{message}</p>
    </div>
  );
}
