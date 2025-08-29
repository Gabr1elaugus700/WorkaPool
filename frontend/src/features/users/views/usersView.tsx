import { useEffect, useState } from "react";
import { userViewModel } from "../viewmodels/usersViewModel";
import { User } from "../models/usersModel";
import { usersService } from "../services/usersService";
import DefaultLayout from "@/layout/DefaultLayout";
import TableUsers from "../components/TableUsers";
import AddDptoButton from "../../departamentos/components/AddDptoButton";

export const UsersView = () => {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    usersService.getAll()
      .then((data) => {
        console.log('Dados Recebidos:', data);
        const mappedData = userViewModel.toResponseArray(data) as User[];
        setUsers(mappedData);
      })
      .catch((error) => {
        console.error('Erro ao buscar dados dos usuários:', error);
      });
  }, []);

  return (
    <DefaultLayout>
      <div>
        <h1>Detalhes do Usuário</h1>
        <AddDptoButton />
        <TableUsers users={users} />
      </div>
    </DefaultLayout>
  );
};

export default UsersView;