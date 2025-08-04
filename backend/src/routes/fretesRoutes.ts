import { Router } from 'express';
import { fretesController  } from '../controllers/fretesController';

const router = Router();

router.post('/rota-base', fretesController.rotaBase);
router.post('/caminhao-rota', fretesController.caminhaoRota);
router.post('/solicitacao-rota', fretesController.solicitacaoRota);

router.get('/rotas', fretesController.listarRotas);
router.get('/fretes-solicitados', fretesController.listarRotasSolicitadas);

router.get('/caminhaoRota/:rotaId', fretesController.getCaminhaoRota);
router.put('/caminhao-rota', fretesController.putCaminhaoRota);
router.put('/solicitacao-rota/:solicitacaoId', fretesController.atualizarSolicitacaoRota);

export default router;