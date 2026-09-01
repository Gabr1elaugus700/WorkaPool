import { apiFetchJson } from "@/lib/apiFetch";
import type { MotoristaDespacho } from "@/features/cargo/types/cargo.types";
import type {
  CreateFleetTruckInput,
  FleetTruck,
  UpdateFleetTruckInput,
} from "../types/fleet.types";

export const fleetService = {
  listTrucks: async (active?: boolean): Promise<FleetTruck[]> => {
    const query =
      active === undefined ? "" : `?active=${active ? "true" : "false"}`;
    return apiFetchJson<FleetTruck[]>(`/api/trucks${query}`);
  },

  createTruck: async (input: CreateFleetTruckInput): Promise<FleetTruck> => {
    return apiFetchJson<FleetTruck>("/api/trucks", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  updateTruck: async (
    id: string,
    input: UpdateFleetTruckInput,
  ): Promise<FleetTruck> => {
    return apiFetchJson<FleetTruck>(`/api/trucks/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(input),
    });
  },

  listMotoristas: async (): Promise<MotoristaDespacho[]> => {
    const users = await apiFetchJson<MotoristaDespacho[]>("/api/cargo/motoristas");
    return users.map((user) => ({
      ...user,
      role: user.role ?? "MOTORISTA",
    }));
  },
};
