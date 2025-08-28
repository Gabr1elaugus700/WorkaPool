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


export default function TableUsers({ users }: { users: User[] }) {
  return (
    <Table className="border-collapse border border-slate-300">
      <TableCaption>Lista de Usuários</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>Nome</TableHead>
          <TableHead>Dpto</TableHead>
          <TableHead>Ações</TableHead>

        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell>{user.id}</TableCell>
            <TableCell>{user.name}</TableCell>
            <TableCell>{user.departamentos}</TableCell>
            <TableCell>
              {/* Adicione botões de ação aqui */}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
