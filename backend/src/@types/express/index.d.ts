import { Role } from "@prisma/client"; // ← é AQUI que você importa o Role do Prisma

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: Role; // ← e usa aqui
      };
    }
  }
}
