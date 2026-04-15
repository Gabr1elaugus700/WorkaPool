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
import { authController } from "../controllers/userController";
import { validate } from "../../../middlewares/validate";
import { registerSchema, loginSchema, changePasswordFirstLoginSchema } from "../schemas/userSchemas";

const router = express.Router();

router.post("/register", validate(registerSchema), authController.register);
router.post("/login", validate(loginSchema), authController.login);
router.post("/change-password-first-login", validate(changePasswordFirstLoginSchema), authController.changePasswordFirstLogin);

export default router;
