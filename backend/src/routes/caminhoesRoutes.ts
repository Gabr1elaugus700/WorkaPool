import { Router } from 'express';
import { cadastroCaminhaoController } from '../controllers/caminhoesController';

const router = Router();

router.post('/', cadastroCaminhaoController.create);

export default router;
