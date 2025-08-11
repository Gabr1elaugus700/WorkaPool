import { Button } from "@/shared/ui/button";
import { Trash } from "lucide-react";
import { CaminhaoRotaVinculo } from "@/types/fretes";

type CaminhaoVinculadoParcial = {
  caminhao_id: string | number;
  modelo: string;
  pedagio_ida: number;
  pedagio_volta: number;
};

interface CaminhoesVinculadosListProps {
  caminhoes: (CaminhaoRotaVinculo | CaminhaoVinculadoParcial)[];
  onRemover: (id: string | number) => void;
}

export function CaminhoesVinculadosList({ caminhoes, onRemover }: CaminhoesVinculadosListProps) {
  if (!caminhoes.length) return null;

  return (
    <div>
      <p className="font-semibold text-sm mb-2">Caminhões já vinculados a esta rota</p>
      <ul className="space-y-1">
        {caminhoes.map((c) => (
          <li
            key={c.caminhao_id}
            className="flex justify-between items-center border p-2 rounded-md text-sm"
          >
            <span>
              Caminhão: {c.modelo ?? c.caminhao_id} | Ida: R$ {Number(c.pedagio_ida).toFixed(2)} | Volta: R$ {Number(c.pedagio_volta).toFixed(2)}
            </span>
            <Button
              variant="destructive"
              size="icon"
              onClick={() => onRemover(c.caminhao_id)}
            >
              <Trash size={14} />
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}