import { Router } from 'express';
import { listVendedores } from '../controllers/vendedorController';

const router = Router();

router.get('/', listVendedores);

export default router;