import { Router } from 'express';
import { getVendas } from '../controllers/pedidosController';


const router = Router();
router.get('/', getVendas);

export default router;