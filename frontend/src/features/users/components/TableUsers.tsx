import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { toast } from "sonner";
import type { User } from "../models/usersModel";
import { usersService } from "../services/usersService";
import { formatUserFuncaoLabel, formatUserRoleLabel } from "../types/user.types";
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
      <div className="w-full overflow-x-auto">
        <Table className="text-sm">
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Login</TableHead>
              <TableHead>Acesso</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Departamento</TableHead>
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
                  <TableCell className="max-w-[12rem] truncate font-medium" title={user.name}>
                    {user.name}
                  </TableCell>
                  <TableCell className="max-w-[10rem] truncate" title={user.user}>
                    {user.user}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{formatUserRoleLabel(user.role)}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={user.isActive === false ? "secondary" : "default"}
                      className={user.isActive === false ? undefined : "bg-primary/90 text-black"}
                    >
                      {user.isActive === false ? "Inativo" : "Ativo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[10rem] truncate" title={user.departamentoNome}>
                    {user.departamentoNome?.trim() ? user.departamentoNome : "—"}
                  </TableCell>
                  <TableCell>{formatUserFuncaoLabel(user.funcao)}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap items-center gap-2">
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
    </div>
  );
}
