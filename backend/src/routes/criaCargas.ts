import { Router } from 'express';
import { cargaController } from '../controllers/cargasController';

const router = Router();
router.post('/', cargaController.CreateCarga);
router.get('/', cargaController.ListarAbertas);

export default router;