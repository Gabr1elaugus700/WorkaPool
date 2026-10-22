import { useState } from "react";
import ExpedicaoIbcAccessDeniedAlert from "../components/ExpedicaoIbcAccessDeniedAlert";
import ExpedicaoIbcTabShell from "../components/ExpedicaoIbcTabShell";
import EntradaPatioCard from "../components/EntradaPatioCard";
import IbcInspecaoDrawer from "../components/IbcInspecaoDrawer";
import { useEntradaPatio } from "../hooks/useEntradaPatio";
import type { EntradaPatioFilaItem } from "../types/ibcEntradaPatio.types";
import { resolveIbcTabStatus } from "../utils/resolveIbcTabStatus";

export default function EntradaPatioIbcView() {
  const { allowed, isLoading, error, data, concluir } = useEntradaPatio();
  const [inspecionando, setInspecionando] = useState<EntradaPatioFilaItem | null>(null);
  const fila = data ?? [];

  if (!allowed) {
    return <ExpedicaoIbcAccessDeniedAlert targetPhrase="a Entrada no pátio" />;
  }

  return (
    <>
      <ExpedicaoIbcTabShell
        activeSection="entrada"
        description="IBCs que voltaram da viagem ou entraram numa troca ficam aqui até cada checklist ativo ser inspecionado. Só então voltam ao estoque do pátio."
        status={resolveIbcTabStatus({
          isLoading,
          error,
          isEmpty: fila.length === 0,
          loadingLabel: "Carregando entradas no pátio…",
          empty: {
            title: "Nenhuma entrada pendente.",
            nextStep: "Ao fechar uma viagem, os IBCs que voltaram aparecem aqui para inspeção.",
          },
        })}
      >
        {fila.map((item) => (
          <EntradaPatioCard
            key={item.id}
            item={item}
            concluindo={concluir.isPending && concluir.variables === item.ibcId}
            onInspecionar={setInspecionando}
            onConcluir={(entrada) => {
              void concluir.mutate(entrada.ibcId);
            }}
          />
        ))}
      </ExpedicaoIbcTabShell>
      {inspecionando ? (
        <IbcInspecaoDrawer
          ibc={{ id: inspecionando.ibcId, identificador: inspecionando.identificador }}
          onClose={() => setInspecionando(null)}
        />
      ) : null}
    </>
  );
}
