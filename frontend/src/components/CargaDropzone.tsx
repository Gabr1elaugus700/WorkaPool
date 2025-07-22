import { useDroppable } from "@dnd-kit/core";
import { Carga } from "@/types/cargas";
import { EditarCargaModal } from "./EditarCargaModal";
import clsx from "clsx";
import { useAuth } from "@/auth/AuthContext";
import { Card } from "@/components/ui/card";

type Props = {
  carga: Carga;
  children: React.ReactNode;
  onChangeSituacao: (id: string, novaSituacao: string) => void;
  onUpdate: (cargaAtualizada: Carga) => void;
};

const situacaoClasses: Record<string, string> = {
  ABERTA: "border-emerald-500",
  SOLICITADA: "border-yellow-400",
  FECHADA: "border-green-600",
  CANCELADA: "border-red-600",
};

export default function CargaDropzone({ carga, children, onUpdate }: Props) {
  const { setNodeRef } = useDroppable({ id: carga.id });
  const { user } = useAuth();

  return (
    <Card
      ref={setNodeRef}
      className={clsx(
        "border-2 rounded mb-4 min-h-[150px] p-4 shadow-md bg-white transition-all",
        situacaoClasses[carga.situacao] || "border-gray-300"
      )}
    >
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div>
          <h2 className="text-lg font-bold">
            Carga: {carga.destino}{" "}
            <span className={clsx("ml-2 text-xs px-2 py-1 rounded font-semibold", {
              "bg-emerald-100 text-emerald-700": carga.situacao === "ABERTA",
              "bg-yellow-100 text-yellow-700": carga.situacao === "SOLICITADA",
              "bg-green-600 text-white": carga.situacao === "FECHADA",
              "bg-red-600 text-white": carga.situacao === "CANCELADA",
            })}>
              {carga.situacao}
            </span>
          </h2>
        </div>

        <div className="text-sm text-muted-foreground">
          Capacidade: {carga.pesoMax}kg Máx • Utilizado:{" "}
          {carga.pesoAtual.toLocaleString("pt-BR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}{" "}
          kg • Custo: R${carga.custoMin}
        </div>

        {user?.role && ["LOGISTICA", "ADMIN"].includes(user.role) && (
          <div className="flex justify-end">
            <EditarCargaModal carga={carga} onUpdated={onUpdate} />
          </div>
        )}
      </div>

      <div className="flex flex-row flex-wrap gap-2">
        {Array.isArray(children) ? children : <>{children}</>}
      </div>
    </Card>
  );
}
