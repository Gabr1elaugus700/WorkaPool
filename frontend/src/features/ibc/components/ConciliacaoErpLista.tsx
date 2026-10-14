import type { BucketConsultaConciliacaoErp, ItemConciliacaoErp } from "../types/conciliacaoErp.types";
import { conciliacaoErpApresentacao } from "../utils/conciliacaoErp.utils";

type Props = { bucket: BucketConsultaConciliacaoErp; itens: ItemConciliacaoErp[] };

export default function ConciliacaoErpLista({ bucket, itens }: Props) {
  const colunas = conciliacaoErpApresentacao.colunas(bucket, itens);
  return (
    <section className="mt-6 rounded-lg border border-border bg-card p-4 shadow-sm sm:p-6">
      <h2 className="mb-3 text-lg font-semibold text-foreground">{conciliacaoErpApresentacao.rotuloBucket(bucket)}</h2>
      {itens.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum IBC neste grupo.</p> : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="py-2 pr-3 font-medium">Identificador</th>
                {colunas.map((coluna) => (
                  <th key={coluna} className="py-2 pr-3 font-medium">{conciliacaoErpApresentacao.rotuloColuna(coluna)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {itens.map((item) => (
                <tr key={item.id} className="border-b border-border last:border-0">
                  <td className="py-2 pr-3 font-medium text-foreground">{item.identificador}</td>
                  {colunas.map((coluna) => (
                    <td key={coluna} className="py-2 pr-3 text-foreground">{conciliacaoErpApresentacao.celula(item, coluna)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
