import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
// Define Role enum locally if not exported from prisma
enum Role {
  USER = "USER",
  ADMIN = "ADMIN"
}

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

interface JwtUserPayload {
  id: string;
  role: Role;
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Token ausente" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtUserPayload;
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: "Token inválido" });
  }
};
