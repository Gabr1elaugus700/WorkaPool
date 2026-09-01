import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import DefaultLayout from "@/layout/DefaultLayout";
import { fleetService } from "../services/fleetService";
import type { CreateFleetTruckInput, FleetMotorista, FleetTruck } from "../types/fleet.types";
import { MotoristasSection } from "../components/MotoristasSection";
import { TrucksTable } from "../components/TrucksTable";

export function FrotaView() {
  const [trucks, setTrucks] = useState<FleetTruck[]>([]);
  const [motoristas, setMotoristas] = useState<FleetMotorista[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [trucksList, motoristasList] = await Promise.all([
        fleetService.listTrucks(),
        fleetService.listMotoristas(),
      ]);
      setTrucks(trucksList);
      setMotoristas(motoristasList);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao carregar dados da frota";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleCreateTruck = async (data: CreateFleetTruckInput) => {
    try {
      await fleetService.createTruck(data);
      toast.success("Caminhão cadastrado com sucesso");
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao cadastrar caminhão");
      throw err;
    }
  };

  const handleUpdateTruck = async (id: string, data: CreateFleetTruckInput) => {
    try {
      await fleetService.updateTruck(id, data);
      toast.success("Caminhão atualizado com sucesso");
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao atualizar caminhão");
      throw err;
    }
  };

  return (
    <DefaultLayout>
      <div className="space-y-8 p-4">
        <div>
          <h1 className="text-2xl font-semibold">Frota</h1>
          <p className="text-sm text-muted-foreground">
            Cadastre caminhões e consulte motoristas disponíveis para despacho.
          </p>
        </div>

        {loading && <p className="text-sm text-muted-foreground">Carregando...</p>}
        {error && <p className="text-sm text-destructive">{error}</p>}

        {!loading && !error && (
          <>
            <TrucksTable
              trucks={trucks}
              onCreate={handleCreateTruck}
              onUpdate={handleUpdateTruck}
            />
            <MotoristasSection motoristas={motoristas} />
          </>
        )}
      </div>
    </DefaultLayout>
  );
}

export default FrotaView;
