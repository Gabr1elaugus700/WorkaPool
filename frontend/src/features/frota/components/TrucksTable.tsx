import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { CreateFleetTruckInput, FleetTruck } from "../types/fleet.types";
import { TruckForm } from "./TruckForm";

type Props = {
  trucks: FleetTruck[];
  onCreate: (data: CreateFleetTruckInput) => Promise<void>;
  onUpdate: (id: string, data: CreateFleetTruckInput) => Promise<void>;
};

export function TrucksTable({ trucks, onCreate, onUpdate }: Props) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Caminhões</h2>
        <TruckForm triggerLabel="Novo caminhão" onSubmit={onCreate} />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Placa</TableHead>
            <TableHead>Capacidade</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {trucks.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                Nenhum caminhão cadastrado
              </TableCell>
            </TableRow>
          ) : (
            trucks.map((truck) => (
              <TableRow key={truck.id}>
                <TableCell>{truck.name}</TableCell>
                <TableCell>{truck.plate}</TableCell>
                <TableCell>{truck.capacity} kg</TableCell>
                <TableCell>{truck.type ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant={truck.active ? "default" : "secondary"}>
                    {truck.active ? "Ativo" : "Inativo"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <TruckForm
                    truck={truck}
                    triggerLabel="Editar"
                    onSubmit={(data) => onUpdate(truck.id, data)}
                  />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
