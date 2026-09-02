import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import DefaultLayout from "@/layout/DefaultLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { fleetService } from "../services/fleetService";
import type { MotoristaDespacho } from "@/features/cargo/types/cargo.types";
import type { CreateFleetTruckInput, FleetTruck } from "../types/fleet.types";
import { FrotaPageHeader } from "../components/FrotaPageHeader";
import { FrotaSectionError } from "../components/FrotaSectionError";
import { FrotaSectionSkeleton } from "../components/FrotaSectionSkeleton";
import { MotoristasSection } from "../components/MotoristasSection";
import { TruckForm } from "../components/TruckForm";
import { TrucksTable } from "../components/TrucksTable";

export function FrotaView() {
  const [trucks, setTrucks] = useState<FleetTruck[]>([]);
  const [motoristas, setMotoristas] = useState<MotoristaDespacho[]>([]);
  const [trucksLoading, setTrucksLoading] = useState(true);
  const [motoristasLoading, setMotoristasLoading] = useState(true);
  const [trucksError, setTrucksError] = useState<string | null>(null);
  const [motoristasError, setMotoristasError] = useState<string | null>(null);
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

  const loadMotoristas = useCallback(async () => {
    setMotoristasLoading(true);
    setMotoristasError(null);
    try {
      const motoristasList = await fleetService.listMotoristas();
      setMotoristas(motoristasList);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao carregar motoristas";
      setMotoristasError(message);
    } finally {
      setMotoristasLoading(false);
    }
  }, []);

  const loadData = useCallback(async () => {
    await Promise.all([loadTrucks(), loadMotoristas(), loadFleetStats()]);
  }, [loadTrucks, loadMotoristas, loadFleetStats]);

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
      motoristaCount: motoristas.length,
    };
  }, [trucks, motoristas, trucksOnTrip]);

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

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px] lg:items-stretch">
          <Card className="flex h-full flex-col">
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

          <Card className="flex h-full flex-col">
            <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
              <div className="min-w-0 space-y-1">
                <CardTitle>Motoristas</CardTitle>
                <CardDescription>
                  Usuários com role MOTORISTA disponíveis para despacho.
                </CardDescription>
              </div>
              <Button asChild variant="outline" size="sm" className="shrink-0">
                <Link to="/users">Gerenciar</Link>
              </Button>
            </CardHeader>
            <CardContent className="flex-1">
              {motoristasLoading ? (
                <FrotaSectionSkeleton rows={4} />
              ) : motoristasError ? (
                <FrotaSectionError
                  message={motoristasError}
                  onRetry={() => void loadMotoristas()}
                />
              ) : (
                <MotoristasSection motoristas={motoristas} />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DefaultLayout>
  );
}

export default FrotaView;
