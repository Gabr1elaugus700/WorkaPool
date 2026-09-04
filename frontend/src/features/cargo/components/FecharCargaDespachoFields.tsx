import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cargoService } from "../services/cargoService";
import type { TruckDespacho } from "../types/cargo.types";

type Props = {
  caminhaoId: string;
  onCaminhaoChange: (id: string) => void;
};

export function FecharCargaDespachoFields({
  caminhaoId,
  onCaminhaoChange,
}: Props) {
  const [trucks, setTrucks] = useState<TruckDespacho[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const trucksList = await cargoService.listTrucks();
        if (!cancelled) {
          setTrucks(trucksList);
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(
            error instanceof Error
              ? error.message
              : "Erro ao carregar caminhões",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <p className="text-sm text-muted-foreground">
        Carregando caminhões...
      </p>
    );
  }

  if (loadError) {
    return <p className="text-sm text-destructive">{loadError}</p>;
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <Label>Caminhão</Label>
        <Select value={caminhaoId || undefined} onValueChange={onCaminhaoChange}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione o caminhão" />
          </SelectTrigger>
          <SelectContent>
            {trucks.map((truck) => (
              <SelectItem key={truck.id} value={truck.id}>
                {truck.plate ? `${truck.name} (${truck.plate})` : truck.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
