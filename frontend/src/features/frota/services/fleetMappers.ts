import type { FleetTruck } from "../types/fleet.types";

export function mapFleetTruckResponse(data: FleetTruck): FleetTruck {
  return {
    id: data.id,
    name: data.name,
    capacity: data.capacity,
    plate: data.plate,
    type: data.type,
    axles: data.axles,
    active: data.active,
    createdAt: data.createdAt,
    codRep: data.codRep,
  };
}
