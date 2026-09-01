export type TruckRecord = {
  id: string;
  name: string;
  capacity: number;
  plate: string;
  type: string | null;
  axles: number | null;
  active: boolean;
  createdAt: Date;
  codRep: number;
};

export type CreateTruckInput = {
  name: string;
  capacity: number;
  plate: string;
  type?: string;
  axles?: number;
  active?: boolean;
  codRep?: number;
};

export type UpdateTruckInput = {
  id: string;
  name?: string;
  capacity?: number;
  plate?: string;
  type?: string | null;
  axles?: number | null;
  active?: boolean;
};

export type ListTrucksFilter = {
  active?: boolean;
};
