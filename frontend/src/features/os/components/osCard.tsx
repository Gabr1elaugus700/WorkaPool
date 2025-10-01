import { Card, CardTitle, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import clsx from "clsx";
import { OsViewModel, StatusType, PrioridadeType } from "../types/osType";
import { EditarOs } from "./editarOs";

type StatusInfo = {
  label: string;
  classes: string; // bg + text (pill cheio)
};

const STATUS_STYLES: Record<StatusType, StatusInfo> = {
  ABERTA: {
    // no layout de referência o “pendente” é vermelho claro
    label: "Pendente",
    classes: "bg-red-100 text-red-800",
  },
  EM_ANDAMENTO: {
    label: "Em andamento",
    classes: "bg-yellow-200 text-yellow-800",
  },
  FINALIZADA: {
    label: "Concluído",
    classes: "bg-green-100 text-green-800",
  },
  CANCELADA: {
    label: "Cancelada",
    classes: "bg-rose-100 text-rose-800",
  },
};

const PRIORIDADE_COLOR: Record<PrioridadeType, string> = {
  ALTA: "text-red-500",
  MEDIA: "text-orange-500",
  BAIXA: "text-green-500",
};

export const OsCard = ({
  descricao,
  problema,
  status,
  prioridade,
  solicitante,
  data_criacao,
  id
}: OsViewModel) => {
  const statusInfo = STATUS_STYLES[status];

  return (
    <Card
      className={clsx(
        // container do card = vidro claro, bordas arredondadas, sombra suave + hover
        "bg-white/50 dark:bg-black/20 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-300",
        "border-x-2 border-y-2 border-gray-200 dark:border-gray-700"
      )}
    >
      <CardHeader className="p-0 mb-2 flex justify-between items-start flex-row">
        <div className="flex justify-between items-start flex-col">
          <CardTitle className="text-lg font-bold text-gray-900 dark:text-gray-100 leading-snug">
            {problema}
          </CardTitle>

          <div className="text-xs text-gray-500 dark:text-gray-400 whitespace-wrap">
            <span >
              {data_criacao}
            </span>
            <span> | </span>
            <span>
              {solicitante}
            </span>
          </div>
        </div>

        <EditarOs 
          idOs={id}
        />
      </CardHeader>

      <CardContent className="p-0 mt-2">
        <div className="mt-1">
          <p className="text-sm text-gray- dark:text-gray-300 mb-4">

          </p>
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
            {descricao}
          </p>
        </div>
        <div className="flex items-center space-x-4">

          <span className={clsx("flex items-center text-sm font-medium", PRIORIDADE_COLOR[prioridade])}>
            Prioridade:
            <span className={clsx("ml-1 font-semibold", PRIORIDADE_COLOR[prioridade])}>
              {prioridade === "ALTA" ? "Alta" : prioridade === "MEDIA" ? "Média" : "Baixa"}
            </span>
          </span>

          {/* Pill de status preenchido */}
          <Badge
            variant="secondary"
            className={clsx(
              "status-badge rounded-full px-2.5 py-0.5 text-xs font-medium",
              statusInfo.classes,
              // remove estilos default do shadcn p/ manter o “pill cheio”
              "border-0"
            )}
          >
            {statusInfo.label}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};
