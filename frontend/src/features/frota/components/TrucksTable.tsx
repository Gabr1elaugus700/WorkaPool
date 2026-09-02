import { useMemo, useState } from "react";
import { Truck } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { CreateFleetTruckInput, FleetTruck } from "../types/fleet.types";
import { TruckForm } from "./TruckForm";

type Props = {
  trucks: FleetTruck[];
  onCreate: (data: CreateFleetTruckInput) => Promise<void>;
  onUpdate: (id: string, data: CreateFleetTruckInput) => Promise<void>;
};

export function TrucksTable({ trucks, onCreate, onUpdate }: Props) {
  const [showInactive, setShowInactive] = useState(false);

  const filteredTrucks = useMemo(
    () => (showInactive ? trucks : trucks.filter((truck) => truck.active)),
    [showInactive, trucks],
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Checkbox
          id="show-inactive"
          checked={showInactive}
          onCheckedChange={(checked) => setShowInactive(checked === true)}
        />
        <Label htmlFor="show-inactive" className="cursor-pointer text-sm font-normal">
          Mostrar inativos
        </Label>
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
          {filteredTrucks.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6}>
                <div className="flex flex-col items-center gap-3 py-8 text-center">
                  <Truck className="h-10 w-10 text-muted-foreground/60" />
                  {trucks.length === 0 ? (
                    <>
                      <div className="space-y-1">
                        <p className="font-medium">Nenhum caminhão cadastrado</p>
                        <p className="text-sm text-muted-foreground">
                          Cadastre o primeiro caminhão para começar a despachar cargas.
                        </p>
                      </div>
                      <TruckForm
                        triggerLabel="Cadastrar primeiro caminhão"
                        onSubmit={onCreate}
                      />
                    </>
                  ) : (
                    <div className="space-y-1">
                      <p className="font-medium">Nenhum caminhão ativo</p>
                      <p className="text-sm text-muted-foreground">
                        Marque &ldquo;Mostrar inativos&rdquo; para ver todos os cadastros.
                      </p>
                    </div>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ) : (
            filteredTrucks.map((truck) => (
              <TableRow key={truck.id}>
                <TableCell className="font-medium">{truck.name}</TableCell>
                <TableCell>{truck.plate}</TableCell>
                <TableCell>{truck.capacity.toLocaleString("pt-BR")} kg</TableCell>
                <TableCell>{truck.type ?? "—"}</TableCell>
                <TableCell>
                  <Badge
                    variant={truck.active ? "default" : "secondary"}
                    className={truck.active ? "bg-primary/90" : undefined}
                  >
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
