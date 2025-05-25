import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
// import { PrismaClient} from "@prisma/client";
import { PrismaClient, Role } from "@prisma/client";
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

export const registerUser = async (user: string, password: string, role?: Role) => {
  const exists = await prisma.user.findUnique({ where: { user: user } });

  if (exists) throw new Error("Usuário já existe");

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = await prisma.user.create({
    data: {
      user: user,
      password: hashedPassword,
      role: role ?? "USER"
    },
  });

  return { id: newUser.id, user: newUser.user, role: newUser.role };
};

export const loginUser = async (user: string, password: string) => {
  const dbUser = await prisma.user.findUnique({ where: { user: user } });

  if (!dbUser || !(await bcrypt.compare(password, dbUser.password))) {
    throw new Error("Credenciais inválidas");
  }
  // console.log("Login de:", dbUser);

  const token = jwt.sign(
    { 
      id: dbUser.id,
      role: dbUser.role, 
      name: dbUser.name, 
      codRep: dbUser.codRep }, 
    JWT_SECRET,
    { expiresIn: "1h" }
  );

  return token;
};
