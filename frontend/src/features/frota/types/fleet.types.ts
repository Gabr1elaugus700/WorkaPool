export type FleetTruck = {
  id: string;
  name: string;
  capacity: number;
  plate: string;
  type: string | null;
  axles: number | null;
  active: boolean;
  createdAt: string;
  codRep: number;
};

export type CreateFleetTruckInput = {
  name: string;
  capacity: number;
  plate: string;
  type?: string;
  axles?: number;
  active?: boolean;
};

export type UpdateFleetTruckInput = Partial<CreateFleetTruckInput>;

export type FleetMotorista = {
  id: string;
  name: string;
  role?: string;
};
