import { SheetBody, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { formatIsoDateLabel } from "@/utils/formatDate";
import type { IbcCadastroDTO } from "../types/ibcCadastro.types";
import { ibcCadastroLabels } from "../utils/ibcCadastroLabels";
import { ibcPlacaCadastro } from "../utils/ibcPlacaCadastro";
import IbcPlacaAmostra from "./IbcPlacaAmostra";

const CUSTODIA: Record<IbcCadastroDTO["custodia"], string> = {
  PATIO: "Pátio", EM_VIAGEM: "Em viagem", ENTRADA: "Entrada no pátio", CLIENTE: "No cliente",
};

export default function CadastroIbcDetalhe({ ibc, produto }: { ibc: IbcCadastroDTO; produto: string | null }) {
  const cor = ibcPlacaCadastro.cor(ibc.corHex);
  const linhas = [
    ["Produto", ibc.universal ? "Universal" : (produto ?? "Sem produto")],
    ["Homologação", ibcPlacaCadastro.naoHomologado(ibc) ? "Não homologado" : "Homologado"],
    ["Situação", ibcCadastroLabels.aptidao[ibc.aptidao]],
    ["Custódia", CUSTODIA[ibc.custodia]],
    ["Limite", ibc.dataLimite ? formatIsoDateLabel(ibc.dataLimite.slice(0, 10)) : "—"],
    ["Placa", cor ?? "Neutra"],
  ] as const;
  return (
    <>
      <SheetHeader>
        <SheetTitle className="flex items-center gap-2">
          <IbcPlacaAmostra corHex={ibc.corHex} />
          <span className="tabular-nums">{ibc.identificador}</span>
        </SheetTitle>
        <SheetDescription>
          {cor ? "A cor da placa identifica o container, como no pátio." : "Legado sem produto. A placa fica neutra."}
        </SheetDescription>
      </SheetHeader>
      <SheetBody>
        <dl className="space-y-3 text-sm">
          {linhas.map(([rotulo, valor]) => (
            <div key={rotulo} className="flex items-baseline justify-between gap-3">
              <dt className="text-xs text-muted-foreground">{rotulo}</dt><dd className="font-medium tabular-nums text-foreground">{valor}</dd>
            </div>
          ))}
        </dl>
      </SheetBody>
    </>
  );
}
