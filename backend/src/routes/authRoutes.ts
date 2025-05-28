import express from "express";
import { login, register, changePasswordFirstL } from "../controllers/authController";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/change-password-first-login", changePasswordFirstL);

export default router;
