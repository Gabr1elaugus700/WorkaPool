import { User } from "@/features/users/models/usersModel";

export interface DepartamentoUsuario  {
  id: string;
  user_id: string;
  departamento_id: string;
  funcao: string;
  ativo: boolean;
  usuario: User;
};