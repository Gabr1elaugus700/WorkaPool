import { useDraggable } from "@dnd-kit/core";
import { Pedido } from "../types/cargo.types";
import { GripVertical, Lock, UserRound, Weight } from "lucide-react";
import formatWeight from "@/utils/formatWeight";

const ADMIN_CODREP = 999;

type Props = {
  pedido: Pedido;
  codRepUsuarioLogado: number;
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

const statusStyles = {
  mine: "border-green-400 bg-green-50",
  other: "border-slate-900 bg-slate-50",
  blocked: "border-red-400 bg-red-50",
  highlighted: "border-emerald-300 bg-emerald-100",
};

const headerStyles = {
  mine: "bg-green-400 text-white",
  other: "bg-slate-900 text-white",
  blocked: "bg-red-500 text-white",
  highlighted: "bg-emerald-400 text-white",
};

function canViewPedidoCompleto(
  codRepUsuarioLogado: number,
  codRepPedido: number,
) {
  return (
    codRepUsuarioLogado === ADMIN_CODREP || codRepUsuarioLogado === codRepPedido
  );
}

export default function PedidoCard({
  pedido,
  codRepUsuarioLogado,
  produtos,
  destaque = false,
  isDraggable = true,
  compact = false,
}: Props) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: pedido.id,
      data: { pedido },
      disabled: !isDraggable,
    });

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)`, zIndex: 50 }
    : undefined;

  const canViewFullData =
    pedido.codRep !== undefined
      ? canViewPedidoCompleto(codRepUsuarioLogado, pedido.codRep)
      : false;

  // Se quiser que a permissão prevaleça sobre o viewMode:
  const isOther = !canViewFullData;

  // Se quiser permitir resumo mesmo para quem pode ver tudo, use esta linha no lugar da de cima:
  // const isOther = !canViewFullData || viewMode === "summary";

  const isBlocked = pedido.bloqueado === "S";

  // Pedidos bloqueados só podem ser arrastados se forem do vendedor logado
  const canDragBlocked = isBlocked && canViewFullData;
  const effectivelyDraggable = isDraggable && (!isBlocked || canDragBlocked);

  const getStatus = () => {
    if (isBlocked) return "blocked";
    if (isOther) return "other";
    if (destaque) return "highlighted";
    return "mine";
  };

  const status = getStatus();

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-lg border-2 ${statusStyles[status]} transition-shadow ${
        isDragging ? "shadow-xl opacity-80" : "shadow-sm"
      } ${!effectivelyDraggable ? "cursor-not-allowed opacity-70" : "cursor-grab active:cursor-grabbing"}`}
      {...(effectivelyDraggable ? { ...listeners, ...attributes } : {})}
    >
      <div
        className={`flex items-center justify-center gap-1.5 rounded-t-md px-3 py-1.5 text-xs font-bold ${headerStyles[status]}`}
      >
        {effectivelyDraggable && (
          <GripVertical className="h-3.5 w-3.5 opacity-70" />
        )}
        {isBlocked && !effectivelyDraggable && <Lock className="h-3.5 w-3.5" />}
        
        <span className="truncate ">
          {pedido.cidade} {isOther ? null : `- ${pedido.numPed}`}
        </span>
        
      </div>

      <div className="space-y-1 p-2.5 text-xs">
        {isOther ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <UserRound className="h-8 w-8 text-slate-600 opacity-60" />
            <div className="text-slate-600">
              <p className="font-bold text-dark ">{pedido.vendedor}</p>
              <p className="flex items-center text-slate-600 text-sm gap-1">
                <Weight className="h-3 w-3" />
                {formatWeight(pedido.peso)}
              </p>
            </div>
          </div>
        ) : (
          <>
            <p className="truncate font-medium text-foreground">
              {pedido.cliente}{" "}
            </p>
            <p className="text-muted-foreground">
              Vendedor:{" "}
              <span className="font-semibold text-foreground">
                {pedido.vendedor}
              </span>
            </p>
            <p className="text-muted-foreground">
              Peso total:{" "}
              <span className="font-semibold text-foreground">
                {formatWeight(pedido.peso)}
              </span>
            </p>

            {!compact &&
              produtos &&
              produtos.map((prod, idx) => (
                <div key={idx} className="mt-1 border-t border-border pt-1">
                  <p className="font-semibold text-foreground">{prod.nome}</p>
                  <p className="text-muted-foreground">
                    Derivação: {prod.derivacao} • Peso:{" "}
                    {formatWeight(prod.peso)}
                  </p>
                </div>
              ))}
          </>
        )}
      </div>
    </div>
  );
}
