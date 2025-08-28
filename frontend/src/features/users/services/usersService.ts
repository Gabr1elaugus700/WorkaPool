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
};
