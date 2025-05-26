import { Router } from 'express';
import { CreateCarga } from '../controllers/cargasController';

const router = Router();
router.post('/', CreateCarga);

export default router;
