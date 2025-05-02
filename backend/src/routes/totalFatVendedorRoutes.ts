import { Router } from 'express';
import { faturamentoPorVendedor } from '../controllers/totalFatVendedorController';

const router = Router();

router.post('/', faturamentoPorVendedor);

export default router;
