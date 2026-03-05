import { Request, Response } from "express";
import { GetCargaByIdUseCase } from "../../useCases/GetCargaById.use-case";
import { UpdatePedidoCargaUseCase } from "../../useCases/UpdatePedidoCarga.use-case";
import { CreateCargaUseCase } from "../../useCases/CreateCarga.use-case";
import { GetPedidosFechadosVendedorUseCase } from "../../useCases/GetPedidosFechadosVendedor.use-case";
import { CreateCargaSchema } from "../schemas/cargoSchema";
import { GetAllOpenCargasUseCase } from "../../useCases/GetAllOpenCargas.use-case";
import { UpdateCargaSituacaoUseCase } from "../../useCases/UpdateCargaSituacao.use-case";
import { SituacaoCarga } from "../../entities/Carga";
import { UpdateCargaUseCase } from "../../useCases/UpdateCarga.use-case";
import { GetPedidosCargaUseCase } from "../../useCases/GetPedidosCarga.use-case";

export class CargoController {
  static async createCarga(req: Request, res: Response): Promise<Response> {
    try {
      const parsed = CreateCargaSchema.safeParse(req.body);

      if (!parsed.success) {
        return res.status(400).json({
          error: parsed.error.errors,
          details: parsed.error.format(),
        });
      }

      const createCargaUseCase = new CreateCargaUseCase();
      const cargo = await createCargaUseCase.execute(parsed.data);
      return res.status(201).json(cargo);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro Interno ao criar carga";
      return res.status(500).json({ error: message });
    }
  }
  static async getCargaById(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ error: "ID da carga é obrigatório." });
      }
      const getCargaByIdUseCase = new GetCargaByIdUseCase();
      const carga = await getCargaByIdUseCase.execute(Number(id));
      return res.json(carga);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro Interno ao buscar carga";
      return res.status(500).json({ error: message });
    }
  }

  static async updatePedido(req: Request, res: Response): Promise<Response> {
    try {
      const { numPed } = req.params;
      const { codCar, posCar } = req.body;
      if (!numPed || codCar == null || posCar == null) {
        return res.status(400).json({
          error: "Dados obrigatórios ausentes para atualização de carga.",
        });
      }
      const updatePedidoCargaUseCase = new UpdatePedidoCargaUseCase();
      await updatePedidoCargaUseCase.execute(
        Number(numPed),
        Number(codCar),
        Number(posCar),
      );
      return res
        .status(200)
        .json({ message: "Pedido atualizado com sucesso." });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Erro Interno ao atualizar pedido";
      return res.status(500).json({ error: message });
    }
  }

  static async getPedidosFechadosPorVendedor(
    req: Request,
    res: Response,
  ): Promise<Response> {
    try {
      const { codRep } = req.params;
      if (!codRep) {
        return res
          .status(400)
          .json({ error: "Código do vendedor é obrigatório." });
      }
      const getPedidosFechadosVendedorUseCase =
        new GetPedidosFechadosVendedorUseCase();
      const pedidos = await getPedidosFechadosVendedorUseCase.execute(
        Number(codRep),
      );
      return res.json(pedidos);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Erro Interno ao buscar pedidos fechados";
      return res.status(500).json({ error: message });
    }
  }

  static async getAllOpenCargas(
    req: Request,
    res: Response,
  ): Promise<Response> {
    try {
      const allOpenCargasUseCase = new GetAllOpenCargasUseCase();
      const cargas = await allOpenCargasUseCase.execute();
      return res.json(cargas);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Erro Interno ao buscar cargas abertas";
      return res.status(500).json({ error: message });
    }
  }

  static async updateSituacao(req: Request, res: Response): Promise<Response> {
    try {
      const { codCar } = req.params;
      const { situacao } = req.body;

      const updateSituacaoSchema = CreateCargaSchema.pick({ situacao: true });
      const parsed = updateSituacaoSchema.safeParse({ situacao });

      if (!parsed.success) {
        return res.status(400).json({
          error: parsed.error.errors,
          details: parsed.error.format(),
        });
      }

      const updateCargaSituacaoUseCase = new UpdateCargaSituacaoUseCase();
      await updateCargaSituacaoUseCase.execute(
        Number(codCar),
        parsed.data.situacao! as SituacaoCarga,
      );
      return res
        .status(200)
        .json({ message: "Situação atualizada com sucesso." });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Erro Interno ao atualizar situação";
      return res.status(500).json({ error: message });
    }
  }

  static async updateCarga(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const parsed = CreateCargaSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: parsed.error.errors,
          details: parsed.error.format(),
        });
      }

      const updateCargaUseCase = new UpdateCargaUseCase();
      const cargo = await updateCargaUseCase.execute(
        id,
        parsed.data.situacao! as SituacaoCarga,
      );
      return res.status(201).json(cargo);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro Interno ao criar carga";
      return res.status(500).json({ error: message });
    }
  }

  static async updatePedidoCarga(
    req: Request,
    res: Response,
  ): Promise<Response> {
    try {
      const { numPed } = req.params;
      const { codCar, posCar } = req.body;
      if (!numPed || codCar == null || posCar == null) {
        return res.status(400).json({
          error: "Dados obrigatórios ausentes para atualização de carga.",
        });
      }

      const updatePedidoCargaUseCase = new UpdatePedidoCargaUseCase();
      await updatePedidoCargaUseCase.execute(
        Number(numPed),
        Number(codCar),
        Number(posCar),
      );
      return res
        .status(200)
        .json({ message: "Pedido atualizado com sucesso." });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Erro Interno ao atualizar pedido";
      return res.status(500).json({ error: message });
    }
  }

  static async getPedidosPorCarga(
    req: Request,
    res: Response,
  ): Promise<Response> {
    try {
      const { codCar } = req.params;
      const { codRep } = req.query;

      if (!codCar) {
        return res.status(400).json({ error: "Código da carga é obrigatório." });
      }

      const getPedidosCargaUseCase = new GetPedidosCargaUseCase();
      let pedidos = await getPedidosCargaUseCase.execute(Number(codCar));

      // Filtrar por vendedor SE fornecido (para visualização)
      if (codRep && Number(codRep) !== 999) {
        pedidos = pedidos.filter(p => p.codRep === Number(codRep));
      }

      return res.json(pedidos);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Erro Interno ao buscar pedidos da carga";
      return res.status(500).json({ error: message });
    }
  }

}
