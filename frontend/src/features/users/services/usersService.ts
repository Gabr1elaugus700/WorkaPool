import { apiFetchJson } from "@/lib/apiFetch";
import type { User } from "../models/usersModel";
import type {
  CreateUserInput,
  ListUsersQuery,
  ResetUserPasswordInput,
  UpdateUserInput,
  UserDepartmentLinkInput,
} from "../types/user.types";

function toUsersQueryString(query?: ListUsersQuery): string {
  const params = new URLSearchParams();
  const search = query?.search?.trim();
  if (search) {
    params.set("search", search);
  }
  if (query?.includeInactive === true) {
    params.set("includeInactive", "true");
  }
  const encoded = params.toString();
  return encoded ? `?${encoded}` : "";
}

export const usersService = {
  getAll: async (query?: ListUsersQuery): Promise<User[]> => {
    return apiFetchJson<User[]>(`/api/users${toUsersQueryString(query)}`);
  },

  findById: async (id: string): Promise<User> => {
    return apiFetchJson<User>(`/api/users/${encodeURIComponent(id)}`);
  },

  create: async (input: CreateUserInput): Promise<User> => {
    return apiFetchJson<User>("/api/users", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  updateUser: async (userId: string, input: UpdateUserInput): Promise<User> => {
    return apiFetchJson<User>(`/api/users/${encodeURIComponent(userId)}/update`, {
      method: "PUT",
      body: JSON.stringify(input),
    });
  },

  resetPassword: async (userId: string, input: ResetUserPasswordInput): Promise<User> => {
    return apiFetchJson<User>(`/api/users/${encodeURIComponent(userId)}/reset-password`, {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  deactivate: async (userId: string): Promise<User> => {
    return apiFetchJson<User>(`/api/users/${encodeURIComponent(userId)}/deactivate`, {
      method: "POST",
    });
  },

  reactivate: async (userId: string): Promise<User> => {
    return apiFetchJson<User>(`/api/users/${encodeURIComponent(userId)}/reactivate`, {
      method: "POST",
    });
  },

  addToDepartment: async (input: UserDepartmentLinkInput): Promise<void> => {
    await apiFetchJson("/api/departamentos/users/add", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  updateDepartmentFunction: async (input: UserDepartmentLinkInput): Promise<void> => {
    await apiFetchJson("/api/departamentos/users/function", {
      method: "PUT",
      body: JSON.stringify(input),
    });
  },

  removeFromDepartment: async (
    userId: string,
    departamentoId: string,
  ): Promise<void> => {
    await apiFetchJson("/api/departamentos/users/remove", {
      method: "DELETE",
      body: JSON.stringify({ userId, departamentoId }),
    });
  },
};
