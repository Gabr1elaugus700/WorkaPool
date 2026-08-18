import { z } from "zod";
import { Request, Response, NextFunction } from "express";

export const validate =
  (schema: z.ZodTypeAny) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (err: unknown) {
      const issues = err instanceof z.ZodError ? err.issues : [];
      return res.status(400).json({
        message: "Erro de validação",
        errors: issues,
      });
    }
  };
