import { getBaseUrl } from "@/lib/apiBase";
import { User } from "../models/usersModel";

export const usersService = {
  getAll: async (): Promise<User[]> => {
    const response = await fetch(`${getBaseUrl()}/api/users`);
    if (!response.ok) {
      throw new Error("Failed to fetch users");
    }
    return response.json();
  },

  findById: async (id: string): Promise<User | null> => {
    const response = await fetch(`${getBaseUrl()}/api/users/${id}`);
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error("Failed to fetch user");
    }
    return response.json();
  },

  addToDepartment: async (userId: string, departmentId: string, funcao: string): Promise<void> => {
    const response = await fetch(`${getBaseUrl()}/api/departamentos/add/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId, departmentId, funcao }),
    });
    if (!response.ok) {
      throw new Error("Failed to add user to department");
    }
  },

  updateUser: async (userId: string, userData: Partial<User>): Promise<void> => {
    console.log("Updating user with data: Service", userData);
    const response = await fetch(`${getBaseUrl()}/api/users/${userId}/update`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });
    if (!response.ok) {
      throw new Error("Failed to update user");
    }
  },

};
