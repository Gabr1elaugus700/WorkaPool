import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KPIData } from "../types/orderLoss.types";

interface KPICardsProps {
  data: KPIData;
}

export const KPICards: React.FC<KPICardsProps> = ({ data }) => {
  const formatWeight = (weight: number) => {
    return `${weight.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} kg`;
  };

  const formatMargin = (margin: number) => {
    return `${margin.toFixed(1)}%`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {/* Card 1: Peso em Negociação */}
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Peso em Negociação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-blue-600">
            {formatWeight(data.weightInNegotiation)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Total em produtos
          </p>
        </CardContent>
      </Card>

      {/* Card 2: Margem Média */}
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Margem Média em Negociação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-green-600">
            {formatMargin(data.averageMargin)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Percentual médio
          </p>
        </CardContent>
      </Card>

      {/* Card 3: Negociações em Andamento */}
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Negociações em Andamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-orange-600">
            {data.activeNegotiations}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Pedidos ativos
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
