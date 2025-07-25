import { Router } from 'express';
import { cadastroCaminhaoController } from '../controllers/caminhoesController';

const router = Router();

router.post('/', cadastroCaminhaoController.create);
router.get('/', cadastroCaminhaoController.get);

export default router;
