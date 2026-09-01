import {
  CreateTruckInput,
  ListTrucksFilter,
  TruckRecord,
  UpdateTruckInput,
} from "../types/Truck.types";

export interface ITrucksRepository {
  create(input: CreateTruckInput): Promise<TruckRecord>;
  findById(id: string): Promise<TruckRecord | null>;
  findByPlate(plate: string): Promise<TruckRecord | null>;
  list(filter?: ListTrucksFilter): Promise<TruckRecord[]>;
  update(input: UpdateTruckInput): Promise<TruckRecord>;
}
