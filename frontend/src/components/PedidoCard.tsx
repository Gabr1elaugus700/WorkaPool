import { useDraggable } from "@dnd-kit/core";
import { Pedido } from "@/types/cargas";
import clsx from "clsx";

type Props = {
  pedido: Pedido;
  produtos?: {
    nome: string;
    derivacao: string;
    peso: number;
  }[];
  destaque?: boolean;
};

export default function PedidoCard({ pedido, produtos, destaque = false }: Props) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: pedido.id,
    data: { pedido },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={clsx(
        "min-w-[200px] max-w-[220px] border rounded-lg p-3 shadow-md cursor-move",
        "transition-colors text-sm space-y-1",
        {
          "bg-red-200 border-red-400 border-2": pedido.bloqueado === "S",
          "bg-emerald-100 border-emerald-300 border-2": pedido.bloqueado !== "S" && destaque,
          "bg-emerald-400 border-emerald-400 border-2": pedido.bloqueado !== "S" && !destaque,
        }
      )}
      style={{
        transform: transform
          ? `translate(${transform.x}px, ${transform.y}px)`
          : undefined,
      }}
    >
      <p className="font-bold text-base">• {pedido.cidade} - {pedido.numPed}</p>
      <p>{pedido.cliente}</p>
      <p className="font-semibold">Vendedor: {pedido.vendedor}</p>
      <p>Peso total: {pedido.peso.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} kg</p>

      {produtos && (
        <ul className="text-xs mt-2 space-y-1">
          {produtos.map((prod, idx) => (
            <li key={idx} className="border-t pt-1">
              <span className="block font-medium">{prod.nome}</span>
              <span>Derivação: {prod.derivacao} • Peso: {prod.peso.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}kg</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
