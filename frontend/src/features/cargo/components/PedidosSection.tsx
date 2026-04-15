import PedidoDropzone from "./PedidoDropzone";
import PedidoCard from "./PedidoCard";
import { Pedido } from "../types/cargo.types";
import { UserRole } from "../types/roles.types";

type Props = {
  pedidos: Pedido[];
  loading: boolean;
  userRole?: UserRole;
  codRepUsuarioLogado?: number;
};

/**
 * Seção que exibe a lista de pedidos soltos (sem carga)
 */
export default function PedidosSection({
  pedidos,
  loading,
  userRole,
  codRepUsuarioLogado,
}: Props) {

  if (userRole === "ALMOX") {
    return null;
  }

  if (loading) {
    return (
      <div className="text-center text-lg text-muted-foreground">
        Carregando pedidos...
      </div>
    );
  }

  return (
    <>

      <PedidoDropzone>
        {pedidos.map((pedido) => (
          <PedidoCard
            key={pedido.id}
            pedido={pedido}
            produtos={pedido.produtos || []}
            viewMode="full"
            isDraggable={true}
            codRepUsuarioLogado={codRepUsuarioLogado || 999}
          />
        ))}
      </PedidoDropzone>
    </>
  );
}
