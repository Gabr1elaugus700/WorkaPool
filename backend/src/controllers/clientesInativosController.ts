import { Request, Response } from "express"
import { getClientesInativos } from "../services/clientesInativosService"

export const handleGetClientesInativos = async (req: Request, res: Response): Promise<any> =>{
  const { inicio, fim, codRep, diasSCompra } = req.body

  if (!inicio || !fim || !codRep) {
    return res.status(400).json({ error: "Parâmetros 'inicio', 'fim' e 'codRep' e 'diasSCompra' são obrigatórios." })
  }


  try {
    const clientes = await getClientesInativos(
      String(inicio),
      String(fim),
      Number(codRep),
      Number(diasSCompra)
    )
    return res.json(clientes)
  } catch (error) {
    console.log("dados Recebidos:", inicio, fim, codRep)
    return res.status(500).json({ error: "(CONTROLLER) Erro ao buscar clientes inativos." })
  }
}

// util interno rápido
const calcularDiferencaMeses = (inicio: Date, fim: Date) =>
  (fim.getFullYear() - inicio.getFullYear()) * 12 + (fim.getMonth() - inicio.getMonth())
