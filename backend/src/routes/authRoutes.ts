/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     summary: Registra novo usuario
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *               name:
 *                 type: string
 *               codRep:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Usuario criado
 * /api/auth/login:
 *   post:
 *     summary: Login
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token JWT
 * /api/auth/change-password-first-login:
 *   post:
 *     summary: Alterar senha primeira vez
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Senha alterada
 */
import express from "express";
import { login, register, changePasswordFirstL } from "../controllers/authController";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/change-password-first-login", changePasswordFirstL);

export default router;
