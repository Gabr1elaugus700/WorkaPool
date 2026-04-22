import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import type { Prisma } from "@prisma/client";
import { userRepository } from "../repositories/userRepository";
import { AppError } from "../../../utils/AppError";
import { RegisterUserInput, User } from "../entities/User";
import { paginateArray, PaginationParams } from "../../../utils/Paginate";

if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is required in production");
}
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";


export async function findUserByIdOrThrow(id: string) {
  const user = await userRepository.findById(id);
  if (!user) throw new AppError({ message: "Usuário não encontrado", statusCode: 404, code: "USER_NOT_FOUND", details: "Usuário não encontrado" });
  return user;
}

export const userService = {
  register: async (userInput: RegisterUserInput) => {
    const exists = await userRepository.findByUser(userInput.user);
    if (exists) throw new AppError({ message: "Usuário já existe, verifique.", statusCode: 400, code: "USER_ALREADY_EXISTS", details: "Usuário já existe, verifique." });

    const newUserEntity = await User.create(userInput);


    const newUser = await userRepository.create({
      ...newUserEntity.toPersistence(),
    });

    return newUser;
  },

  login: async (user: string, password: string) => {
    const dbUser = await userRepository.findByUser(user);

    if (!dbUser || !(await bcrypt.compare(password, dbUser.password))) {
      throw new AppError({ message: "Credenciais inválidas", statusCode: 401, code: "INVALID_CREDENTIALS", details: "Credenciais inválidas" });
    }

    const tokenPayload = {
      id: dbUser.id,
      role: dbUser.role,
      name: dbUser.name,
      codRep: dbUser.codRep,
      mustChangePassword: dbUser.mustChangePassword,
      departamentos: await userRepository.findUserDepartamentos(dbUser.id),
      user: dbUser.user
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: "1h" });

    return {
      token,
      mustChangePassword: dbUser.mustChangePassword
    };
  },

  changePasswordFirstLogin: async (user: string, newPassword: string) => {
    const dbUser = await userRepository.findByUser(user);
    if (!dbUser) throw new AppError({ message: "Usuário não encontrado", statusCode: 404, code: "USER_NOT_FOUND", details: "Usuário não encontrado" });

    if (!dbUser.mustChangePassword) {
      throw new AppError({ message: "Senha já foi alterada anteriormente", statusCode: 400, code: "PASSWORD_ALREADY_CHANGED", details: "Senha já foi alterada anteriormente" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await userRepository.update(dbUser.id, {
      password: hashedPassword,
      mustChangePassword: false,
    });

    return { message: "Senha alterada com sucesso", code: "PASSWORD_CHANGED_SUCCESSFULLY", details: "Senha alterada com sucesso" };
  },

  findAll: async (params?: PaginationParams) => {
    const users = await userRepository.findAll();
    return paginateArray(users, params);
  },

  findById: async (id: string) => findUserByIdOrThrow(id),

  update: async (id: string, data: Prisma.UserUpdateInput) => {
    await findUserByIdOrThrow(id);
    return await userRepository.update(id, data);
  },

  delete: async (id: string) => {
    await findUserByIdOrThrow(id);
    return await userRepository.delete(id);
  },

  // Função específica para buscar departamentos de um usuário (informação do usuário)
  buscarDepartamentosDoUsuario: async (userId: string) => {
    return await userRepository.findUserDepartamentos(userId);
  }
};
