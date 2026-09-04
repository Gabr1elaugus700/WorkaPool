import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useState } from "react";
import { toast } from "sonner";
import type { User } from "../models/usersModel";
import { usersService } from "../services/usersService";
import EditarButton from "./EditarButton";
import { UserForm } from "./UserForm";
import { UsersResetPasswordDialog } from "./UsersResetPasswordDialog";
import { UsersSetActiveButton } from "./UsersSetActiveButton";

type Props = {
  users: User[];
  fetchUsers: () => void;
};

export default function TableUsers({ users, fetchUsers }: Props) {
  const [editUser, setEditUser] = useState<User | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const handleEdit = async (userId: string) => {
    try {
      const userData = await usersService.findById(userId);
      const firstLink = Array.isArray(userData.departamentos)
        ? userData.departamentos[0]
        : undefined;
      const funcaoFromLink =
        firstLink && typeof firstLink !== "string" && "funcao" in firstLink
          ? String((firstLink as { funcao?: string }).funcao ?? "")
          : "";

      setEditUser({
        ...userData,
        funcao: funcaoFromLink || userData.funcao || "FUNCIONARIO",
      });
      setIsEditOpen(true);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao carregar usuário";
      toast.error(message);
    }
  };

  return (
    <div className="w-full rounded-lg border border-border bg-card p-4 shadow-sm">
      <UserForm
        user={editUser}
        open={isEditOpen}
        onOpenChange={(open) => {
          setIsEditOpen(open);
          if (!open) {
            setEditUser(null);
          }
        }}
        onSuccess={fetchUsers}
      />
      <Table>
        <TableCaption>Lista de usuários</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Login</TableHead>
            <TableHead>Acesso</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Dpto</TableHead>
            <TableHead>Função</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                Nenhum usuário encontrado. Crie o primeiro cadastro administrativo.
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.user}</TableCell>
                <TableCell>{user.role}</TableCell>
                <TableCell>{user.isActive === false ? "Inativo" : "Ativo"}</TableCell>
                <TableCell>{user.departamentoNome ?? ""}</TableCell>
                <TableCell>{user.funcao ?? ""}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap items-center gap-1">
                    <EditarButton
                      userId={user.id}
                      userLogin={user.user}
                      onEdit={handleEdit}
                    />
                    <UsersResetPasswordDialog
                      userId={user.id}
                      userLogin={user.user}
                      onSuccess={fetchUsers}
                    />
                    <UsersSetActiveButton
                      userId={user.id}
                      userLogin={user.user}
                      isActive={user.isActive !== false}
                      onSuccess={fetchUsers}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
