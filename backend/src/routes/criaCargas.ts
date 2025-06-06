import { Router } from 'express';
import { cargaController } from '../controllers/cargasController';

const router = Router();
router.post('/', cargaController.CreateCarga);
router.get('/', cargaController.ListarAbertas);
router.patch('/:id/situacao', cargaController.atualizarSitCarga);
router.put('/:id', cargaController.atualizarCargaCompleta)

export default router;