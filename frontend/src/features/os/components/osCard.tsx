import { Card, CardTitle, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Clock, User, AlertCircle } from "lucide-react";
import { OsViewModel, StatusType, PrioridadeType } from "../types/osType";
import clsx from "clsx";

export const OsCard = ({ descricao, status, prioridade, solicitante, data_criacao }: OsViewModel) => {

  // Debug: log dos valores recebidos
  console.log('OsCard props:', { prioridade, status });

  // Cores para Status
  const getStatusColor = (status: StatusType) => {
    switch (status) {
      case "ABERTA":
        return "bg-blue-50 text-blue-700 order-blue-300 hover:bg-blue-100";
      case "EM_ANDAMENTO":
        return "bg-yellow-50 text-yellow-700 border-yellow-300 hover:bg-yellow-100";
      case "FINALIZADA":
        return "bg-green-50 text-green-700 border-green-300 hover:bg-green-100";
      case "CANCELADA":
        return "bg-red-50 text-red-700 border-red-300 hover:bg-red-100";
      default:
        return "bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100";
    }
  };

  // Cores para Prioridade (baseado no texto)
  const getPrioridadeColor = (prioridade: PrioridadeType) => {
    switch (prioridade) {
      case "BAIXA":
        return "bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100";
      case "MEDIA":
        return "bg-orange-50 text-orange-700 border-orange-300 hover:bg-orange-100";
      case "ALTA":
        return "bg-red-50 text-red-700 border-red-300 hover:bg-red-100";
      default:
        return "bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100";
    }
  };

  return (
    <Card className={clsx(
      "relative overflow-hidden hover:shadow-lg transition-all duration-200 hover:-translate-y-1 cursor-pointer border-l-4",
      {
      "border-l-gray-400": prioridade === "BAIXA",
      "border-l-yellow-500": prioridade === "MEDIA", 
      "border-l-red-500": prioridade === "ALTA"
      }
    )}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start gap-2">
          <CardTitle className="text-sm font-semibold text-gray-900 line-clamp-2 ">
            {descricao}
          </CardTitle>
          <div className="flex gap-2 flex-shrink-0">
            <Badge 
              className={`text-xs font-semibold px-3 py-1 ${getPrioridadeColor(prioridade)}`}
              variant="outline"
            >
              {prioridade === "ALTA" && <AlertCircle className="w-3 h-3 mr-1" />}
              {prioridade === "ALTA" && "ALTA"}
              {prioridade === "MEDIA" && "MÉDIA"}
              {prioridade === "BAIXA" && "BAIXA"}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <Separator className="mb-3" />
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Badge 
              className={`text-sm font-semibold px-3 py-1 ${getStatusColor(status)}`}
              variant="outline"
            >
              <div className={`w-2 h-2 rounded-full mr-2 ${
                status === "ABERTA" ? "bg-blue-600" :
                status === "EM_ANDAMENTO" ? "bg-yellow-500" :
                status === "FINALIZADA" ? "bg-green-600" :
                "bg-red-600"
              }`} />
              {status === "ABERTA" && "ABERTA"}
              {status === "EM_ANDAMENTO" && "EM ANDAMENTO"}
              {status === "FINALIZADA" && "FINALIZADA"}
              {status === "CANCELADA" && "CANCELADA"}
            </Badge>
          </div>
          
          <div className="flex items-center text-sm text-gray-600 gap-4">
            <div className="flex items-center gap-1">
              <User className="w-4 h-4" />
              <span>{solicitante}</span>
            </div>
            
            {data_criacao && (
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{new Date(data_criacao).toLocaleDateString('pt-BR')}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
