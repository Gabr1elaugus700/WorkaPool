import { apiFetchJson } from "@/lib/apiFetch";
import type {
  CreateFleetTruckInput,
  FleetMotorista,
  FleetTruck,
  UpdateFleetTruckInput,
} from "../types/fleet.types";
import { mapFleetTruckResponse } from "./fleetMappers";

export { mapFleetTruckResponse } from "./fleetMappers";

export const fleetService = {
  listTrucks: async (active?: boolean): Promise<FleetTruck[]> => {
    const query =
      active === undefined ? "" : `?active=${active ? "true" : "false"}`;
    const data = await apiFetchJson<FleetTruck[]>(`/api/trucks${query}`);
    return data.map(mapFleetTruckResponse);
  },

  createTruck: async (input: CreateFleetTruckInput): Promise<FleetTruck> => {
    const data = await apiFetchJson<FleetTruck>("/api/trucks", {
      method: "POST",
      body: JSON.stringify(input),
    });
    return mapFleetTruckResponse(data);
  },

  updateTruck: async (
    id: string,
    input: UpdateFleetTruckInput,
  ): Promise<FleetTruck> => {
    const data = await apiFetchJson<FleetTruck>(`/api/trucks/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(input),
    });
    return mapFleetTruckResponse(data);
  },

  listMotoristas: async (): Promise<FleetMotorista[]> => {
    const users = await apiFetchJson<
      Array<{ id: string; name: string; role?: string }>
    >("/api/cargo/motoristas");
    return users.map((user) => ({
      id: user.id,
      name: user.name,
      user: user.name,
      role: user.role ?? "MOTORISTA",
    }));
  },
};
