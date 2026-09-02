import { Skeleton } from "@/components/ui/skeleton";

type FrotaMetrics = {
  trucksActive: number;
  trucksInactive: number;
  trucksOnTrip: number;
  motoristaCount: number;
};

type Props = {
  metrics: FrotaMetrics;
  statsLoading?: boolean;
};

type MetricCard = {
  label: string;
  value: number;
  valueClassName?: string;
};

export function FrotaPageHeader({ metrics, statsLoading = false }: Props) {
  const { trucksActive, trucksInactive, trucksOnTrip, motoristaCount } = metrics;

  const cards: MetricCard[] = [
    {
      label: "Caminhões ativos",
      value: trucksActive,
      valueClassName: "text-primary",
    },
    {
      label: "Caminhões inativos",
      value: trucksInactive,
    },
    {
      label: "Em viagem",
      value: trucksOnTrip,
      valueClassName: "text-carga-fechada",
    },
    {
      label: "Motoristas",
      value: motoristaCount,
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Frota</h1>
        <p className="text-sm text-muted-foreground">
          Cadastre caminhões e consulte motoristas disponíveis para despacho.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="flex min-h-[5.5rem] flex-col justify-between rounded-lg border bg-card p-4"
          >
            <span className="text-xs font-medium text-muted-foreground">{card.label}</span>
            {statsLoading && card.label === "Em viagem" ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <p className={`text-2xl font-semibold tabular-nums ${card.valueClassName ?? ""}`}>
                {card.value}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
