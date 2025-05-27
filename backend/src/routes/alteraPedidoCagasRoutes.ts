import { Router } from 'express';
import { updatePedido } from '../controllers/alteraPedidoCargaController';

const router = Router();

router.put('/:numPed', updatePedido);

export default router;