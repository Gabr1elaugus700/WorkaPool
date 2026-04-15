import { useDroppable } from "@dnd-kit/core";
import { Carga, CargaSituacao } from "../types/cargo.types";
import { UserRole } from "../types/roles.types";
import { EditarCargaModal } from "./EditarCargaModal";
// import CargaProgress from "./CargaProgress";
import { Badge } from "@/components/ui/badge";
import { canEditCarga } from "../utils/permissions";
import { CapacityBar } from "./CapacityBar";

type Props = {
  carga: Carga;
  children: React.ReactNode;
  onChangeSituacao: (id: string, novaSituacao: CargaSituacao) => void;
  onUpdate: (cargaAtualizada: Carga) => void;
  userRole?: UserRole;
  codRepUsuarioLogado?: number;
};

const situacaoVariant: Record<CargaSituacao, "default" | "secondary" | "destructive" | "outline"> = {
  ABERTA: "default",
  SOLICITADA: "outline",
  FECHADA: "secondary",
  CANCELADA: "destructive",
  ENTREGUE: "secondary",
};

function formatPrevisaoSaida(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const weekday = d.toLocaleDateString("pt-BR", { weekday: "long" });
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${weekday}, ${day}-${month}-${year}`;
}

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
      <div
        className={
          userRole === "VENDAS"
            ? "mb-3 grid grid-cols-3 items-center gap-2"
            : "mb-3 flex items-start justify-between gap-2"
        }
      >
        <div className="flex min-w-0 items-center gap-2 justify-self-start">
          <h3 className="text-lg font-bold text-foreground">
            Carga: {carga.destino}
          </h3>
          <Badge
            variant={situacaoVariant[carga.situacao]}
            className="shrink-0 text-[10px]"
          >
            {carga.situacao}
          </Badge>
        </div>

        {userRole === "VENDAS" && (
          <div className="min-w-0 justify-self-center text-center">
            <p className="text-[10px] font-medium text-muted-foreground">
              Previsão de saída
            </p>
            <p className="text-sm font-bold leading-tight text-foreground sm:text-base">
              {formatPrevisaoSaida(carga.previsaoSaida)}
            </p>
          </div>
        )}

        <div
          className={
            userRole === "VENDAS"
              ? "flex items-center gap-3 justify-self-end"
              : "flex shrink-0 items-center gap-3"
          }
        >
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

      
      <CapacityBar usedKg={carga.pesoAtual} capacityKg={carga.pesoMaximo} />

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
