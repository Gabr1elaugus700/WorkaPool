import { Router } from "express"
import { handleGetClientesInativos } from "../controllers/clientesInativosController"

const router = Router()

router.get("/", handleGetClientesInativos)

export default router
