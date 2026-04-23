import { ICargoRepository } from "../repositories/ICargoRepository";
import { CargoRepository } from "../repositories/CargoRepository";
import { GetCargasBySituacaoUseCase } from "./GetCargasBySituacao.use-case";
import { SituacaoCarga } from "../entities/Carga";
import { CargaProcessor } from "../services/CargaProcessor";
import { PesoCargaCalculator } from "../services/PesoCargaCalculator";
import { PedidoService } from "../../pedidos/services/PedidoService";
import { PedidosRepository } from "../../pedidos/repositories/PedidosRepository";

/**
 * Use Case: Verifica e processa mudanças de peso em pedidos de cargas abertas.
 * 
 * Fluxo:
 * 1. Busca todas as cargas abertas
 * 2. Para cada carga, verifica mudanças de peso nos pedidos
 * 3. Remove pedidos que não cabem mais
 * 4. Reposiciona pedidos com peso aumentado
 * 5. Atualiza histórico de peso
 */
export class CheckPesoPedidoHistoricoUseCase {
  private readonly cargoRepository: ICargoRepository;
  private readonly pedidoService: PedidoService;
  private readonly pesoCargaCalculator: PesoCargaCalculator;
  private readonly cargaProcessor: CargaProcessor;

  constructor() {
    this.cargoRepository = new CargoRepository(new PedidosRepository());
    this.pedidoService = new PedidoService(new PedidosRepository());
    this.pesoCargaCalculator = new PesoCargaCalculator(
      this.cargoRepository,
      this.pedidoService,
    );
    this.cargaProcessor = new CargaProcessor(
      this.cargoRepository,
      this.pesoCargaCalculator,
      this.pedidoService,
    );
  }

  async execute() {
    const openCargas = await new GetCargasBySituacaoUseCase().execute(
      SituacaoCarga.ABERTA,
    );

    console.log(`🔍 Verificando ${openCargas.data.length} carga(s) aberta(s)...`);

    let totalRemovidos = 0;
    let totalReposicionados = 0;
    let totalSemHistorico = 0;

    for (const carga of openCargas.data) {
      console.log(`\n📦 Processando carga ${carga.codCar}...`);

      const resultado = await this.cargaProcessor.processarMudancasPesoPedidos(carga);

      totalRemovidos += resultado.pedidosRemovidos.length;
      totalReposicionados += resultado.pedidosReposicionados.length;
      totalSemHistorico += resultado.pedidosSemHistorico.length;

      if (resultado.pedidosRemovidos.length > 0) {
        console.log(`🚫 Pedidos removidos: ${resultado.pedidosRemovidos.join(', ')}`);
      }

      if (resultado.pedidosReposicionados.length > 0) {
        console.log(`🔄 Pedidos reposicionados: ${resultado.pedidosReposicionados.join(', ')}`);
      }

      if (resultado.pedidosSemHistorico.length > 0) {
        console.log(`📝 Históricos criados: ${resultado.pedidosSemHistorico.join(', ')}`);
      }

      const pesoDisponivel = await this.pesoCargaCalculator.calculaPesoDisponivel(carga);
      console.log(`✅ Carga ${carga.codCar} - Peso disponível: ${pesoDisponivel}kg`);
    }

    console.log(
      `\n✅ Verificação concluída:\n` +
      `   📦 ${openCargas.data.length} carga(s) processada(s)\n` +
      `   🚫 ${totalRemovidos} pedido(s) removido(s)\n` +
      `   🔄 ${totalReposicionados} pedido(s) reposicionado(s)\n` +
      `   📝 ${totalSemHistorico} histórico(s) criado(s)`
    );

    return openCargas;
  }
}
