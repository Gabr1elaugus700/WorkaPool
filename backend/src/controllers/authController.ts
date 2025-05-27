import { Request, Response } from "express";
import { registerUser, loginUser } from "../services/authService";

export const register = async (req: Request, res: Response) => {
  const { user, password, role, name } = req.body;

  try {
    const createdUser = await registerUser(user, password, role, name);
    res.status(201).json(createdUser);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const login = async (req: Request, res: Response) => {
  const { user, password } = req.body;

  try {
    const token = await loginUser(user, password);
    res.json({ token });
  } catch (err: any) {
    res.status(401).json({ error: err.message });
  }
};
