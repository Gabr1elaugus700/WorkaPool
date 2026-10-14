import type { EmprestimoAtrasado } from "../types/emprestimoAtrasado.types";
import { emprestimoAtrasadoApresentacao } from "../utils/emprestimoAtrasado.utils";

type Props = { itens: readonly EmprestimoAtrasado[] };

const COLUNAS = ["Identificador", "Cliente", "Pedido", "Carga", "Representante", "Data esperada"] as const;

function classeValor(valor: string): string {
  const tom = valor === "Não informado" ? "text-muted-foreground" : "text-foreground";
  return `whitespace-nowrap px-4 py-3 ${tom}`;
}

export default function EmprestimosAtrasadosTabela({ itens }: Props) {
  if (itens.length === 0) {
    return (
      <section className="rounded-lg border border-border bg-card px-6 py-10 shadow-sm">
        <p className="text-sm text-muted-foreground">Nenhum empréstimo em atraso.</p>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[44rem] border-collapse text-left text-sm tabular-nums">
          <caption className="sr-only">
            Empréstimos em atraso, do prazo mais antigo ao mais recente
          </caption>
          <thead>
            <tr className="border-b border-border text-xs font-medium text-muted-foreground">
              {COLUNAS.map((coluna) => (
                <th key={coluna} scope="col" className="whitespace-nowrap px-4 py-3 text-left font-medium">
                  {coluna}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {itens.map((item) => {
              const cliente = emprestimoAtrasadoApresentacao.cliente(item);
              const representante = emprestimoAtrasadoApresentacao.representante(item);
              return (
                <tr
                  key={item.id}
                  className="border-b border-border transition-colors duration-150 last:border-0 hover:bg-muted/60"
                >
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-foreground">{item.identificador}</td>
                  <td className={classeValor(cliente)}>{cliente}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-foreground">{item.numPed}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-foreground">{item.codCar}</td>
                  <td className={classeValor(representante)}>{representante}</td>
                  <td className="whitespace-nowrap px-4 py-3 font-semibold text-foreground">
                    {emprestimoAtrasadoApresentacao.dataEsperada(item)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
