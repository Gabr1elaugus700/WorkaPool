import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

interface JwtUserPayload {
  id: string;
  role: Role;
  codRep?: number;
  name?: string;
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Token ausente" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtUserPayload;
    req.user = {
      id: decoded.id,
      role: decoded.role,
      codRep: decoded.codRep,
      name: decoded.name,
    };
    next();
  } catch {
    return res.status(401).json({ error: "Token inválido" });
  }
};

export const requireRoles =
  (roles: Role[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.user?.role;

    if (!userRole) {
      return res.status(401).json({ error: "Usuário não autenticado" });
    }

    if (!roles.includes(userRole)) {
      return res.status(403).json({ error: "Acesso negado" });
    }

    next();
  };
