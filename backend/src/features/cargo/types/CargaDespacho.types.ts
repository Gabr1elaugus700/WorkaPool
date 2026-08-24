import { Role } from "@prisma/client";

export type CargaDespachoRecord = {
  id: string;
  cargaId: string;
  motoristaId: string;
  caminhaoId: string;
  fechadoPorId: string;
  fechadoEm: Date;
};

export type CloseCargaDespachoInput = {
  codCar: number;
  motoristaId: string;
  caminhaoId: string;
  fechadoPorId: string;
};

export type CargoUserRef = {
  id: string;
  role: Role;
  name: string;
};

export type CargoTruckRef = {
  id: string;
  name: string;
};
