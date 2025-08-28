import { Card, CardTitle, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Clock, User, AlertCircle } from "lucide-react";

type StatusType = "ABERTA" | "EM_ANDAMENTO" | "FINALIZADA" | "CANCELADA";
type PrioridadeType = "baixa" | "media" | "alta";

interface OsCardProps {
  descricao: string;
  status: StatusType;
  prioridade: PrioridadeType;
  solicitante: string;
  data_criacao?: string;
}

export const OsCard = ({ descricao, status, prioridade, solicitante, data_criacao }: OsCardProps) => {
  
  // Cores para Status
  const getStatusColor = (status: StatusType) => {
    switch (status) {
      case "ABERTA":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "EM_ANDAMENTO":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "FINALIZADA":
        return "bg-green-100 text-green-800 border-green-200";
      case "CANCELADA":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Cores para Prioridade
  const getPrioridadeColor = (prioridade: PrioridadeType) => {
    switch (prioridade) {
      case "baixa":
        return "bg-gray-100 text-gray-700 border-gray-300";
      case "media":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "alta":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  // Borda lateral colorida baseada na prioridade
  const getBorderColor = (prioridade: PrioridadeType) => {
    switch (prioridade) {
      case "baixa":
        return "border-l-blue-400";
      case "media":
        return "border-l-orange-500";
      case "alta":
        return "border-l-red-500";
      default:
        return "border-l-gray-400";
    }
  };

  return (
    <Card className={`relative overflow-hidden hover:shadow-lg transition-all duration-200 hover:-translate-y-1 cursor-pointer border-l-4 ${getBorderColor(prioridade)}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start gap-2">
          <CardTitle className="text-lg font-semibold text-gray-900 line-clamp-2">
            {descricao}
          </CardTitle>
          <div className="flex gap-2 flex-shrink-0">
            <Badge 
              className={`text-xs font-medium ${getPrioridadeColor(prioridade)}`}
              variant="outline"
            >
              {prioridade === "alta" && <AlertCircle className="w-3 h-3 mr-1" />}
              {prioridade}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <Separator className="mb-3" />
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Badge 
              className={`text-sm font-medium ${getStatusColor(status)}`}
              variant="outline"
            >
              <div className={`w-2 h-2 rounded-full mr-2 ${
                status === "ABERTA" ? "bg-blue-500" :
                status === "EM_ANDAMENTO" ? "bg-yellow-500" :
                status === "FINALIZADA" ? "bg-green-500" :
                "bg-red-500"
              }`} />
              {status.replace("_", " ")}
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
