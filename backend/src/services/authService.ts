import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
// import { PrismaClient} from "@prisma/client";
import { PrismaClient, Role } from "@prisma/client";
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

export const registerUser = async (user: string, password: string, role?: Role, name?: string) => {
  const exists = await prisma.user.findUnique({ where: { user: user } });

  if (exists) throw new Error("Usuário já existe");

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = await prisma.user.create({
    data: {
      user: user,
      password: hashedPassword,
      role: role ?? "USER",
      name: name,
      mustChangePassword: true, // Default to true for new users
    },
  });

  return { id: newUser.id, user: newUser.user, role: newUser.role };
};

export const loginUser = async (user: string, password: string) => {
  const dbUser = await prisma.user.findUnique({ where: { user: user } });

  if (!dbUser || !(await bcrypt.compare(password, dbUser.password))) {
    throw new Error("Credenciais inválidas");
  }

  const tokenPayload = {
    id: dbUser.id,
    role: dbUser.role,
    name: dbUser.name,
    codRep: dbUser.codRep,
    mustChangePassword: dbUser.mustChangePassword, // ← importante!
  };

  const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: "1h" }
  );

  return { 
    token, 
    mustChangePassword: dbUser.mustChangePassword 
  };
};

export const changePasswordFirstLogin = async (user: string, newPassword: string) => {
  const dbUser = await prisma.user.findUnique({ where: { user: user } });
  if (!dbUser) throw new Error("Usuário não encontrado");

  if (!dbUser.mustChangePassword) {
    throw new Error("Senha já foi alterada anteriormente");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { user: user },
    data: {
      password: hashedPassword,
      mustChangePassword: false,
    },
  });

  return { message: "Senha alterada com sucesso" };
};

