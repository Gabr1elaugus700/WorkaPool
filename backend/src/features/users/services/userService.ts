import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { PrismaClient, Role } from "@prisma/client";
import { userRepository } from "../repositories/userRepository";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

export const userService = {
  // Funções de autenticação
  register: async (user: string, password: string, role?: Role, name?: string, codRep?: number) => {
    const exists = await prisma.user.findUnique({ where: { user: user } });

    if (exists) throw new Error("Usuário já existe, verifique.");

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await userRepository.create({
      user: user,
      password: hashedPassword,
      role: role ?? "USER",
      name: name ?? "",
      codRep: codRep ?? 0,
      mustChangePassword: true,
    });

    return { id: newUser.id, user: newUser.user, role: newUser.role, codRep: newUser.codRep };
  },

  login: async (user: string, password: string) => {
    const dbUser = await prisma.user.findUnique({ where: { user: user } });

    if (!dbUser || !(await bcrypt.compare(password, dbUser.password))) {
      throw new Error("Credenciais inválidas");
    }

    const tokenPayload = {
      id: dbUser.id,
      role: dbUser.role,
      name: dbUser.name,
      codRep: dbUser.codRep,
      mustChangePassword: dbUser.mustChangePassword,
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: "1h" });

    return { 
      token, 
      mustChangePassword: dbUser.mustChangePassword 
    };
  },

  changePasswordFirstLogin: async (user: string, newPassword: string) => {
    const dbUser = await prisma.user.findUnique({ where: { user: user } });
    if (!dbUser) throw new Error("Usuário não encontrado");

    if (!dbUser.mustChangePassword) {
      throw new Error("Senha já foi alterada anteriormente");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await userRepository.update(dbUser.id, {
      password: hashedPassword,
      mustChangePassword: false,
    });

    return { message: "Senha alterada com sucesso" };
  },

  // CRUD básico de usuários
  findAll: async () => {
    return await userRepository.findAll();
  },

  findById: async (id: string) => {
    const user = await userRepository.findById(id);
    if (!user) throw new Error("Usuário não encontrado");
    return user;
  },

  update: async (id: string, data: any) => {
    return await userRepository.update(id, data);
  },

  delete: async (id: string) => {
    return await userRepository.delete(id);
  },

  // Função específica para buscar departamentos de um usuário (informação do usuário)
  buscarDepartamentosDoUsuario: async (userId: string) => {
    return await userRepository.findUserDepartamentos(userId);
  }
};
