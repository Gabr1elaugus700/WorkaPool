import { Router } from 'express';
import { fretesController  } from '../controllers/fretesController';

const router = Router();

router.post('/rota-base', fretesController.rotaBase);
router.post('/caminhao-rota', fretesController.caminhaRota);
router.post('/solicitacao-rota', fretesController.solicitacaoRota);

router.get('/rotas', fretesController.listarRotas);
router.get('/fretes-solicitados', fretesController.listarRotasSolicitadas);


export default router;