import { User } from "../models/usersModel"

export const userViewModel = {
  toResponse: (user: User) => ({
    id: user.id,
    name: user.name,
    role: user.role,
    user: user.user,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }),
  toResponseArray: (users: User[]) => users.map(userViewModel.toResponse),
};
