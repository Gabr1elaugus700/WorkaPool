import { Request, Response } from "express"
import { getClientesInativos } from "../services/clientesInativosService"

export const handleGetClientesInativos = async (req: Request, res: Response): Promise<any> =>{
  const { dataInicio, dataFim, codRep, diasSCompra } = req.body

  if (!dataInicio || !dataFim || !codRep || !diasSCompra) {
    return res.status(400).json({ error: "Parâmetros 'dataInicio', 'dataFim' e 'codRep' e 'diasSCompra' são obrigatórios." })
  }


  try {
    const clientes = await getClientesInativos(
      String(dataInicio),
      String(dataFim),
      Number(codRep),
      Number(diasSCompra)
    )
    return res.json(clientes)
  } catch (error) {
    console.log("dados Recebidos:", dataInicio, dataFim, codRep)
    return res.status(500).json({ error: "(CONTROLLER) Erro ao buscar clientes inativos." })
  }
}
  