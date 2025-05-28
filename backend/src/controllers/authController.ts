import { Request, Response } from "express";
import { registerUser, loginUser, changePasswordFirstLogin } from "../services/authService";

export const register = async (req: Request, res: Response) => {
  const { user, password, role, name, codRep } = req.body;

  try {
    const createdUser = await registerUser(user, password, role, name, codRep);
    res.status(201).json(createdUser);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const login = async (req: Request, res: Response) => {
  const { user, password } = req.body;

  try {
    const { token, mustChangePassword } = await loginUser(user, password);
    res.json({ token, mustChangePassword });
  } catch (err: any) {
    res.status(401).json({ error: err.message });
  }
};

export const changePasswordFirstL = async (req: Request, res: Response) => {
  const { user, newPassword } = req.body;
  try {
    const result = await changePasswordFirstLogin(user, newPassword);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};
