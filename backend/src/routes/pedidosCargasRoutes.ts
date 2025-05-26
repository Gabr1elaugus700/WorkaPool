// backend/src/routes/pedidoRoutes.ts
import { Router } from 'express';
import { getPedCargas } from '../controllers/pedidoCargaController';

const router = Router();

router.get('/', getPedCargas);

export default router;
