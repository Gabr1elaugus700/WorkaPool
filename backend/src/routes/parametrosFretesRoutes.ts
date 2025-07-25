import { Router } from 'express';
import { parametrosGlobaisViagemController } from '../controllers/parametrosFretesController';

const router = Router();

router.post('/create', parametrosGlobaisViagemController.create);
router.patch('/', parametrosGlobaisViagemController.patch);
router.get('/', parametrosGlobaisViagemController.get);

export default router;
