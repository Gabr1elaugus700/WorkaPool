import type { Prisma } from "@prisma/client";
import type {
  DecidirAberturaEntrada,
  EntradaPatioAberta,
} from "../types/IbcEntradaPatio.types";

export interface IIbcEntradaPatioRepository {
  /**
   * Trava o IBC e grava a entrada pendente na mesma transação.
   * `db` é a transação do chamador (Fechar Viagem, #38); sem ela, abre a própria.
   */
  abrir(
    ibcId: string,
    decidir: DecidirAberturaEntrada,
    db?: Prisma.TransactionClient,
  ): Promise<EntradaPatioAberta>;
}
