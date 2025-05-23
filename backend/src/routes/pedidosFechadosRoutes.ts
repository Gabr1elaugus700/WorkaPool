import { Router } from 'express';
import { getPedFechados } from '../controllers/pedidosFechadosControllers';


const router = Router();
router.get('/', getPedFechados);

export default router;