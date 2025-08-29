import { useEffect, useState } from "react";
import { User } from "../models/usersModel";
import { usersService } from "../services/usersService";
import DefaultLayout from "@/layout/DefaultLayout";
import TableUsers from "../components/TableUsers";
import AddDptoButton from "../../departamentos/components/AddDptoButton";

export const UsersView = () => {
  const [users, setUsers] = useState<User[]>([]);

  const fetchUsers = async () => {
    const data = await usersService.getAll();
    setUsers(
      data.map((item) => ({
        ...item,
        departamentoNome: Array.isArray(item.departamentos) && item.departamentos[0]?.departamento
          ? item.departamentos[0].departamento.name
          : ""
      }))
    );
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <DefaultLayout>
      <div>
        <div className="flex justify-between  p-4">
          <h1 className="font-semibold text-2xl">Usuários</h1>
          <AddDptoButton />
        </div>
        <TableUsers users={users} fetchUsers={fetchUsers} />
      </div>
    </DefaultLayout>
  );
};

export default UsersView;