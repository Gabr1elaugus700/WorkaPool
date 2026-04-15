import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { User } from "../models/usersModel";
import EditarButton from "./EditarButton";
import { usersService } from "../services/usersService";
import { useState } from "react";
import EditUserModal from "./ModaEdit";



export default function TableUsers({ users, fetchUsers }: { users: User[]; fetchUsers: () => void }) {
  const [editUser, setEditUser] = useState<User | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);


  const handleEdit = async (userId: string) => {
    try {
      const userData = await usersService.findById(userId);
      setEditUser(userData);
      setIsEditModalOpen(true);
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };
  console.log("Users in TableUsers:", users);

  return (
    <div className="border-collapse border border-zinc-500 rounded-lg p-4 w-full">
      <EditUserModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        user={editUser}
        fetchUsers={fetchUsers}
      />
      <Table >
        <TableCaption>Lista de Usuários</TableCaption>
        <TableHeader>
          <TableRow>
            {/* <TableHead>ID</TableHead> */}
            <TableHead>Nome</TableHead>
            <TableHead>Login</TableHead>
            <TableHead>Acesso</TableHead>
            <TableHead>Dpto</TableHead>
            <TableHead>Função</TableHead>
            <TableHead>Ações</TableHead>

          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              {/* <TableCell>{user.id}</TableCell> */}
              <TableCell>{user.name}</TableCell>
              <TableCell>{user.user}</TableCell>
              <TableCell>{user.role}</TableCell>

              <TableCell>
                {user.departamentoNome ?? ""}
              </TableCell>
              <TableCell>{user.funcao}</TableCell>
              <TableCell>
                <EditarButton userId={user.id} onEdit={handleEdit} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <EditUserModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        user={editUser}
        fetchUsers={fetchUsers}
      />
    </div>
  );
}
