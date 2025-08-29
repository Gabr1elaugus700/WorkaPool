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


export default function TableUsers({ users }: { users: User[] }) {
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

  return (
    <div>
      <EditUserModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        user={editUser}
      />
      <Table className="border-collapse border border-slate-300">
        <TableCaption>Lista de Usuários</TableCaption>
        <TableHeader>
          <TableRow>
            {/* <TableHead>ID</TableHead> */}
            <TableHead>Nome</TableHead>
            <TableHead>Dpto</TableHead>
            <TableHead>Login</TableHead>
            <TableHead>Função</TableHead>
            <TableHead>Ações</TableHead>

          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              {/* <TableCell>{user.id}</TableCell> */}
              <TableCell>{user.name}</TableCell>
              <TableCell>{user.departamentos}</TableCell>
              <TableCell>{user.user}</TableCell>  
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
      />
    </div>
  );
}
