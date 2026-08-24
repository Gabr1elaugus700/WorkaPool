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
import type { MotoristaDespacho, TruckDespacho } from "../types/cargo.types";

type Props = {
  motoristaId: string;
  caminhaoId: string;
  onMotoristaChange: (id: string) => void;
  onCaminhaoChange: (id: string) => void;
};

export function FecharCargaDespachoFields({
  motoristaId,
  caminhaoId,
  onMotoristaChange,
  onCaminhaoChange,
}: Props) {
  const [motoristas, setMotoristas] = useState<MotoristaDespacho[]>([]);
  const [trucks, setTrucks] = useState<TruckDespacho[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const [motoristasList, trucksList] = await Promise.all([
          cargoService.listMotoristas(),
          cargoService.listTrucks(),
        ]);
        if (!cancelled) {
          setMotoristas(motoristasList);
          setTrucks(trucksList);
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(
            error instanceof Error
              ? error.message
              : "Erro ao carregar motoristas e caminhões",
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
        Carregando motoristas e caminhões...
      </p>
    );
  }

  if (loadError) {
    return <p className="text-sm text-destructive">{loadError}</p>;
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <Label>Motorista</Label>
        <Select value={motoristaId || undefined} onValueChange={onMotoristaChange}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione o motorista" />
          </SelectTrigger>
          <SelectContent>
            {motoristas.map((motorista) => (
              <SelectItem key={motorista.id} value={motorista.id}>
                {motorista.name || motorista.id}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2">
        <Label>Caminhão</Label>
        <Select value={caminhaoId || undefined} onValueChange={onCaminhaoChange}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione o caminhão" />
          </SelectTrigger>
          <SelectContent>
            {trucks.map((truck) => (
              <SelectItem key={truck.id} value={truck.id}>
                {truck.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
