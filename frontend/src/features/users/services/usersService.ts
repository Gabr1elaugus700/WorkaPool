import { apiFetchJson } from "@/lib/apiFetch";
import type { User } from "../models/usersModel";
import type {
  CreateUserInput,
  UpdateUserInput,
  UserDepartmentLinkInput,
} from "../types/user.types";

export const usersService = {
  getAll: async (): Promise<User[]> => {
    return apiFetchJson<User[]>("/api/users");
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
