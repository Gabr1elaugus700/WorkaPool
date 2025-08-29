export interface User {
  id: string;
  name: string;
  user: string;
  codRep?: number;
  role?: string;
  isActive?: boolean;
  departamentos?: string[];
  createdAt: Date;
  updatedAt: Date;
  mustChangePassword: boolean;
  funcao: string;
}