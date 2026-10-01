import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import DefaultLayout from "@/layout/DefaultLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { fleetService } from "../services/fleetService";
import type { CreateFleetTruckInput, FleetTruck } from "../types/fleet.types";
import { FrotaPageHeader } from "../components/FrotaPageHeader";
import { FrotaSectionError } from "../components/FrotaSectionError";
import { FrotaSectionSkeleton } from "../components/FrotaSectionSkeleton";
import { TruckForm } from "../components/TruckForm";
import { TrucksTable } from "../components/TrucksTable";

export function FrotaView() {
  const [trucks, setTrucks] = useState<FleetTruck[]>([]);
  const [trucksLoading, setTrucksLoading] = useState(true);
  const [trucksError, setTrucksError] = useState<string | null>(null);
  const [trucksOnTrip, setTrucksOnTrip] = useState(0);
  const [statsLoading, setStatsLoading] = useState(true);

  const loadTrucks = useCallback(async () => {
    setTrucksLoading(true);
    setTrucksError(null);
    try {
      const trucksList = await fleetService.listTrucks();
      setTrucks(trucksList);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao carregar caminhões";
      setTrucksError(message);
    } finally {
      setTrucksLoading(false);
    }
  }, []);

  const loadFleetStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const stats = await fleetService.getStats();
      setTrucksOnTrip(stats.trucksOnTrip);
    } catch {
      setTrucksOnTrip(0);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const loadData = useCallback(async () => {
    await Promise.all([loadTrucks(), loadFleetStats()]);
  }, [loadTrucks, loadFleetStats]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const metrics = useMemo(() => {
    const trucksActive = trucks.filter((truck) => truck.active).length;
    const trucksInactive = trucks.length - trucksActive;
    return {
      trucksActive,
      trucksInactive,
      trucksOnTrip,
    };
  }, [trucks, trucksOnTrip]);

  const handleCreateTruck = async (data: CreateFleetTruckInput) => {
    try {
      await fleetService.createTruck(data);
      toast.success("Caminhão cadastrado com sucesso");
      await Promise.all([loadTrucks(), loadFleetStats()]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao cadastrar caminhão");
      throw err;
    }
  };

  const handleUpdateTruck = async (id: string, data: CreateFleetTruckInput) => {
    try {
      await fleetService.updateTruck(id, data);
      toast.success("Caminhão atualizado com sucesso");
      await Promise.all([loadTrucks(), loadFleetStats()]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao atualizar caminhão");
      throw err;
    }
  };

  return (
    <DefaultLayout>
      <div className="space-y-6 p-4">
        <FrotaPageHeader metrics={metrics} statsLoading={statsLoading} />

        <Card className="flex flex-col">
          <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
            <div className="min-w-0 space-y-1">
              <CardTitle>Caminhões</CardTitle>
              <CardDescription>
                Gerencie a frota disponível para despacho de cargas.
              </CardDescription>
            </div>
            <TruckForm triggerLabel="Novo caminhão" onSubmit={handleCreateTruck} />
          </CardHeader>
          <CardContent className="flex-1">
            {trucksLoading ? (
              <FrotaSectionSkeleton />
            ) : trucksError ? (
              <FrotaSectionError message={trucksError} onRetry={() => void loadTrucks()} />
            ) : (
              <TrucksTable
                trucks={trucks}
                onCreate={handleCreateTruck}
                onUpdate={handleUpdateTruck}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </DefaultLayout>
  );
}

export default FrotaView;
