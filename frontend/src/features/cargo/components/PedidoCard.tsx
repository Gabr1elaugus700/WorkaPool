import { useDraggable } from "@dnd-kit/core";
import { Pedido } from "../types/cargo.types";
import { GripVertical, Lock, UserRound, Weight } from "lucide-react";

type Props = {
  pedido: Pedido;
  produtos?: {
    nome: string;
    derivacao: string;
    peso: number;
  }[];
  destaque?: boolean;
  viewMode?: "full" | "summary";
  isDraggable?: boolean;
  compact?: boolean;
};

// Estilos para cada status de pedido
const statusStyles = {
  mine: "border-emerald-400 bg-emerald-50",
  other: "border-slate-300 bg-slate-50",
  blocked: "border-red-400 bg-red-50",
  highlighted: "border-emerald-300 bg-emerald-100",
};

const headerStyles = {
  mine: "bg-emerald-400 text-white",
  other: "bg-slate-400 text-white",
  blocked: "bg-red-500 text-white",
  highlighted: "bg-emerald-400 text-white",
};

export default function PedidoCard({ 
  pedido, 
  produtos, 
  destaque = false,
  viewMode = "full",
  isDraggable = true,
  compact = false,
}: Props) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: pedido.id,
    data: { pedido },
    disabled: !isDraggable,
  });

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)`, zIndex: 50 }
    : undefined;

  // Determina o status visual do pedido
  const getStatus = () => {
    if (pedido.bloqueado === "S") return "blocked";
    if (viewMode === "summary") return "other";
    if (destaque) return "highlighted";
    return "mine";
  };

  const status = getStatus();
  const isOther = viewMode === "summary";
  const isBlocked = pedido.bloqueado === "S";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-lg border-2 ${statusStyles[status]} transition-shadow ${
        isDragging ? "shadow-xl opacity-80" : "shadow-sm"
      } ${isBlocked ? "cursor-not-allowed opacity-70" : "cursor-grab active:cursor-grabbing"}`}
      {...(!isBlocked && isDraggable ? { ...listeners, ...attributes } : {})}
    >
      {/* Header */}
      <div className={`flex items-center gap-1.5 rounded-t-md px-3 py-1.5 text-xs font-bold ${headerStyles[status]}`}>
        {!isBlocked && isDraggable && <GripVertical className="h-3.5 w-3.5 opacity-70" />}
        {isBlocked && <Lock className="h-3.5 w-3.5" />}
        <span className="truncate">
          {pedido.cidade} 
        </span>
      </div>

      {/* Body */}
      <div className="p-2.5 text-xs space-y-1">
        {isOther ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <UserRound className="h-8 w-8 text-slate-400 opacity-60" />
            <div>
              <p className="font-semibold text-foreground">{pedido.vendedor}</p>
              <p className="flex items-center gap-1">
                <Weight className="h-3 w-3" />
                {pedido.peso.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} kg
              </p>
            </div>
          </div>
        ) : (
          <>
            <p className="font-medium truncate text-foreground">{pedido.cliente}</p>
            <p className="text-muted-foreground">
              Vendedor: <span className="font-semibold text-foreground">{pedido.vendedor}</span>
            </p>
            <p className="text-muted-foreground">
              Peso total:{" "}
              <span className="font-semibold text-foreground">
                {pedido.peso.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} kg
              </span>
            </p>
            {!compact &&
              produtos &&
              produtos.map((prod, idx) => (
                <div key={idx} className="mt-1 border-t border-border pt-1">
                  <p className="font-semibold text-foreground">{prod.nome}</p>
                  <p className="text-muted-foreground">
                    Derivação: {prod.derivacao} • Peso: {prod.peso}kg
                  </p>
                </div>
              ))}
          </>
        )}
      </div>
    </div>
  );
}
