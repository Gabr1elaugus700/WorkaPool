import { useDroppable } from "@dnd-kit/core";
import { Carga, CargaSituacao } from "../types/cargo.types";
import { UserRole } from "../types/roles.types";
import { EditarCargaModal } from "./EditarCargaModal";
import CargaProgress from "./CargaProgress";
import { Badge } from "@/components/ui/badge";
import { canEditCarga } from "../utils/permissions";

type Props = {
  carga: Carga;
  children: React.ReactNode;
  onChangeSituacao: (id: string, novaSituacao: CargaSituacao) => void;
  onUpdate: (cargaAtualizada: Carga) => void;
  userRole?: UserRole;
  userCodRep?: number;
};

const situacaoVariant: Record<CargaSituacao, "default" | "secondary" | "destructive" | "outline"> = {
  ABERTA: "default",
  SOLICITADA: "outline",
  FECHADA: "secondary",
  CANCELADA: "destructive",
  ENTREGUE: "secondary",
};

export default function CargaDropzone({ 
  carga, 
  children, 
  onUpdate, 
  onChangeSituacao,
  userRole,
}: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: carga.id });

  const childrenArray = Array.isArray(children) 
    ? children 
    : children 
      ? [children] 
      : [];

  const hasChildren = childrenArray.length > 0;

  return (
    <div
      ref={setNodeRef}
      className={`rounded-xl border-2 border-border bg-card p-4 mb-4 transition-colors ${
        isOver ? "border-primary bg-accent/50" : ""
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-bold text-foreground">
            Carga: {carga.destino}
          </h3>
          <Badge
            variant={situacaoVariant[carga.situacao]}
            className="text-[10px]"
          >
            {carga.situacao}
          </Badge>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right text-xs text-muted-foreground">
            <p>Capacidade: {carga.pesoMaximo.toLocaleString("pt-BR")}kg Máx</p>
            <p>Código: {carga.codCar}</p>
          </div>

          {canEditCarga(userRole) && (
            <EditarCargaModal 
              carga={carga} 
              onUpdated={onUpdate} 
              onChangeSituacao={onChangeSituacao} 
            />
          )}
        </div>
      </div>

      {/* Capacity bar */}
      <CargaProgress pesoAtual={carga.pesoAtual} pesoMaximo={carga.pesoMaximo} />

      {/* Orders grid */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 min-h-[80px]">
        {!hasChildren && (
          <p className="col-span-full text-center text-sm text-muted-foreground py-6 border-2 border-dashed border-border rounded-lg">
            Arraste pedidos aqui
          </p>
        )}
        {childrenArray}
      </div>
    </div>
  );
}
