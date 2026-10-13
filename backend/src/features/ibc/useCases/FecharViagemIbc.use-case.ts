import { Role } from "@prisma/client";
import { assertCanFecharViagemIbc } from "../permissions/assertCanFecharViagemIbc";
import { IIbcConciliacaoRepository } from "../repositories/IbcConciliacaoRepository";
import { IIbcExpedicaoRepository } from "../repositories/IIbcExpedicaoRepository";
import { AbrirEntradaPatioUseCase } from "./AbrirEntradaPatio.use-case";
import { loadCargaFotoExpedicao } from "./loadCargaFotoExpedicao";
import { planejarFechamentoViagem } from "../services/planejarFechamentoViagem";
import { AppError } from "../../../utils/AppError";

export type FecharViagemIbcResult = {
  codCar: number;
  expedicaoIbcId: string;
  viagemFechadaEm: Date;
};

export class FecharViagemIbcUseCase {
  constructor(
    private readonly expedicoes: IIbcExpedicaoRepository,
    private readonly conciliacoes: IIbcConciliacaoRepository,
    private readonly abrirEntrada: AbrirEntradaPatioUseCase,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(input: { codCar: number; actorRole: Role; actorId: string }): Promise<FecharViagemIbcResult> {
    assertCanFecharViagemIbc(input.actorRole);
    const { carga, pedidosIbc } = await loadCargaFotoExpedicao(this.expedicoes, input.codCar);
    const expedicao = await this.conciliacoes.findPorCarga(carga.id);
    if (!expedicao) {
      throw new AppError({ message: `Carga ${input.codCar} não tem expedição IBC fechada`, statusCode: 409, code: "IBC_EXPEDICAO_AUSENTE", details: { codCar: input.codCar } });
    }
    if (expedicao.viagemFechadaEm) {
      throw new AppError({ message: "A viagem já foi fechada", statusCode: 409, code: "IBC_VIAGEM_JA_FECHADA", details: { codCar: input.codCar } });
    }
    const [alocacoes, marcas, retornos] = await Promise.all([
      this.expedicoes.listAlocacoesByCargaId(carga.id),
      this.conciliacoes.listMarcas(expedicao.id),
      this.conciliacoes.listRetornos(expedicao.id),
    ]);
    const now = this.now();
    const plano = planejarFechamentoViagem({ now, alocacoes, pedidos: pedidosIbc, marcas, retornos });
    await this.conciliacoes.fecharViagem(
      {
        expedicaoId: expedicao.id,
        actorId: input.actorId,
        now,
        codCar: carga.codCar,
        efeitos: plano.efeitos,
        ficaram: plano.ficaram,
      },
      async (tx) => {
        for (const entrada of plano.entradas) {
          await this.abrirEntrada.execute({
            actorRole: input.actorRole,
            actorId: input.actorId,
            ibcId: entrada.ibcId,
            origem: entrada.origem,
          }, tx);
        }
      },
    );
    return { codCar: carga.codCar, expedicaoIbcId: expedicao.id, viagemFechadaEm: now };
  }
}
