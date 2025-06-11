import { Router } from "express"
import { handleGetClientesInativos } from "../controllers/clientesInativosController"

const router = Router()

router.post("/", handleGetClientesInativos)

export default router
