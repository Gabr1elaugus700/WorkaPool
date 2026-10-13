import { useState } from "react";
import DefaultLayout from "@/layout/DefaultLayout";
import ExpedicaoIbcAccessDeniedAlert from "../components/ExpedicaoIbcAccessDeniedAlert";
import ExpedicaoIbcAsyncState from "../components/ExpedicaoIbcAsyncState";
import ExpedicaoIbcPageHeader from "../components/ExpedicaoIbcPageHeader";
import EntradaPatioFilaRow from "../components/EntradaPatioFilaRow";
import IbcInspecaoDialog from "../components/IbcInspecaoDialog";
import { useEntradaPatio } from "../hooks/useEntradaPatio";
import type { EntradaPatioFilaItem } from "../types/ibcEntradaPatio.types";
import { toError } from "../utils/toError";

export default function EntradaPatioIbcView() {
  const { allowed, isLoading, error, data, concluir } = useEntradaPatio();
  const [inspecionando, setInspecionando] = useState<EntradaPatioFilaItem | null>(null);
  const fila = data ?? [];

  if (!allowed) {
    return <ExpedicaoIbcAccessDeniedAlert targetPhrase="a Entrada no pátio" />;
  }

  return (
    <ExpedicaoIbcAsyncState
      loading={isLoading}
      error={error ? toError(error) : null}
      loadingLabel="Carregando entradas no pátio…"
    >
      <DefaultLayout>
        <ExpedicaoIbcPageHeader title="Entrada no pátio" activeSection="entrada" />
        <div className="rounded-lg bg-card p-4 shadow-sm sm:p-6">
          <p className="mb-4 max-w-prose text-sm text-muted-foreground">
            IBCs que voltaram da viagem ou entraram numa troca ficam aqui até cada checklist ativo ser inspecionado.
            Só então voltam ao estoque do pátio.
          </p>
          {fila.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma entrada pendente.</p>
          ) : (
            fila.map((item) => (
              <EntradaPatioFilaRow
                key={item.id}
                item={item}
                concluindo={concluir.isPending && concluir.variables === item.ibcId}
                onInspecionar={setInspecionando}
                onConcluir={(entrada) => {
                  void concluir.mutate(entrada.ibcId);
                }}
              />
            ))
          )}
        </div>
        {inspecionando ? (
          <IbcInspecaoDialog
            ibc={{ id: inspecionando.ibcId, identificador: inspecionando.identificador }}
            onClose={() => setInspecionando(null)}
          />
        ) : null}
      </DefaultLayout>
    </ExpedicaoIbcAsyncState>
  );
}
