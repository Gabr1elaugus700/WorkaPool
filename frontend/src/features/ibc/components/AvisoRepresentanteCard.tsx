import { Button } from "@/components/ui/button";
import type { AvisoRepresentante } from "../types/avisoRepresentante.types";
import { avisoRepresentanteLabels } from "../utils/avisoRepresentante.utils";

type Props = {
  aviso: AvisoRepresentante;
  marcando: boolean;
  onMarcarLido: (id: string) => void;
};

/**
 * Um pedido cujos IBCs ficaram no cliente depois do Fechar Viagem.
 */
export default function AvisoRepresentanteCard({ aviso, marcando, onMarcarLido }: Props) {
  return (
    <article className="mb-3 rounded-xl border-2 border-border bg-card p-4">
      <h2 className="text-lg font-bold text-foreground">
        Pedido {aviso.numPed} · Carga {aviso.codCar} · {aviso.cliente}
      </h2>
      <ul className="mt-3 space-y-2">
        {aviso.itens.map((item) => (
          <li key={item.identificador} className="text-sm text-foreground">
            <span className="font-medium">{item.identificador}</span>
            <span className="text-muted-foreground"> · {avisoRepresentanteLabels.modalidade(item)}</span>
          </li>
        ))}
      </ul>
      {aviso.lidoEm ? (
        <p className="mt-3 text-xs text-muted-foreground">{avisoRepresentanteLabels.lidoEm(aviso.lidoEm)}</p>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-3"
          disabled={marcando}
          onClick={() => onMarcarLido(aviso.id)}
        >
          Marcar como lido
        </Button>
      )}
    </article>
  );
}
