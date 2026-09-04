import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import DefaultLayout from "@/layout/DefaultLayout";
import AddDptoButton from "@/features/departamentos/components/AddDptoButton";
import type { User } from "../models/usersModel";
import { usersService } from "../services/usersService";
import TableUsers from "../components/TableUsers";
import { UserForm } from "../components/UserForm";
import { UsersListFilters } from "../components/UsersListFilters";

function mapUserRow(item: User): User {
  const firstLink = Array.isArray(item.departamentos) ? item.departamentos[0] : undefined;
  const departamentoNome =
    firstLink && typeof firstLink !== "string" && firstLink.departamento
      ? firstLink.departamento.name
      : "";
  const funcao =
    firstLink && typeof firstLink !== "string" && "funcao" in firstLink
      ? String((firstLink as { funcao?: string }).funcao ?? item.funcao ?? "")
      : item.funcao ?? "";

  return {
    ...item,
    departamentoNome,
    funcao,
  };
}

export const UsersView = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [includeInactive, setIncludeInactive] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await usersService.getAll({ search, includeInactive });
      setUsers(data.map(mapUserRow));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao carregar usuários";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [search, includeInactive]);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  return (
    <DefaultLayout>
      <div className="space-y-6 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold">Usuários</h1>
          <div className="flex flex-wrap items-center gap-2">
            <AddDptoButton />
            <UserForm triggerLabel="Novo usuário" onSuccess={() => void fetchUsers()} />
          </div>
        </div>
        <UsersListFilters
          search={search}
          includeInactive={includeInactive}
          onSearchSubmit={setSearch}
          onIncludeInactiveChange={setIncludeInactive}
        />
        {loading ? (
          <div className="space-y-2 rounded-lg border border-border bg-card p-4 shadow-sm">
            <div className="h-10 animate-pulse rounded-md bg-muted" />
            <div className="h-10 animate-pulse rounded-md bg-muted" />
            <div className="h-10 animate-pulse rounded-md bg-muted" />
            <div className="h-10 animate-pulse rounded-md bg-muted" />
            <div className="h-10 animate-pulse rounded-md bg-muted" />
          </div>
        ) : (
          <TableUsers users={users} fetchUsers={() => void fetchUsers()} />
        )}
      </div>
    </DefaultLayout>
  );
};

export default UsersView;
