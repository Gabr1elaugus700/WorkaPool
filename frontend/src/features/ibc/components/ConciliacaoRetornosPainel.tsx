import type { ConciliacaoViagemClienteDTO, ConciliacaoViagemItemDTO } from "../types/conciliacaoViagem.types";
import { conciliacaoRetornos } from "../utils/conciliacaoRetornos.utils";

type Props = {
  clientes: ConciliacaoViagemClienteDTO[];
  itens: ConciliacaoViagemItemDTO[];
  disabled: boolean;
  onChange: (chaveCliente: string, patch: Partial<Pick<ConciliacaoViagemClienteDTO, "quantidadePapel" | "confirmouDivergencia">>) => void;
};

export default function ConciliacaoRetornosPainel({ clientes, itens, disabled, onChange }: Props) {
  return (
    <section className="mt-6 rounded-lg border border-border bg-card p-4 shadow-sm">
      <h2 className="text-lg font-semibold text-foreground">Retornos sem identificação</h2>
      <p className="mt-1 max-w-[65ch] text-sm text-muted-foreground">
        Lance a quantidade escrita no papel de cada cliente. Se for diferente das trocas marcadas, confirme antes de fechar.
      </p>
      <ul className="mt-4 flex flex-col gap-3">
        {clientes.map((cliente) => {
          const trocas = conciliacaoRetornos.contarTrocas(itens, cliente);
          const diverge = cliente.quantidadePapel != null && cliente.quantidadePapel !== trocas;
          return (
            <li key={cliente.chaveCliente} className="flex flex-wrap items-end justify-between gap-3 border-t border-border pt-3">
              <div>
                <p className="text-sm font-medium text-foreground">{cliente.cliente}</p>
                <p className="text-xs text-muted-foreground">{trocas} {trocas === 1 ? "troca marcada" : "trocas marcadas"}</p>
              </div>
              <label className="text-xs font-medium text-foreground">
                No papel
                <input
                  className="mt-1 block h-10 w-24 rounded-md border border-border bg-background px-3 text-sm text-foreground"
                  type="number"
                  min={0}
                  inputMode="numeric"
                  disabled={disabled}
                  value={cliente.quantidadePapel ?? ""}
                  onChange={(event) => onChange(cliente.chaveCliente, {
                    quantidadePapel: conciliacaoRetornos.lerQuantidadePapel(event.target.value),
                  })}
                />
              </label>
              {diverge ? (
                <label className="flex items-center gap-2 text-sm text-foreground">
                  <input
                    type="checkbox"
                    disabled={disabled}
                    checked={cliente.confirmouDivergencia}
                    onChange={(event) => onChange(cliente.chaveCliente, { confirmouDivergencia: event.target.checked })}
                  />
                  Confirmo a divergência
                </label>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
