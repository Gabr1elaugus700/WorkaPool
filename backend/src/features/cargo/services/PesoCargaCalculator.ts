import { ICargoRepository } from "../repositories/ICargoRepository";
import { Carga } from "../entities/Carga";
import { Pedido, SimulacaoPedidoNaCarga } from "../entities/Pedido";
import { PedidoService } from "../../pedidos/services/PedidoService";
import { PedidosRepository } from "../../pedidos/repositories/PedidosRepository";

type ResultadoValidacaoPedidoNaCarga = {
  podeAdicionar: boolean;
  pesoDisponivel: number;
  pesoPedido: number;
  pesoTotalAposAdicionar: number;
  excesso: number;
};

export class PesoCargaCalculator {
  constructor(
    private readonly cargoRepository: ICargoRepository,
    private readonly pedidoService: PedidoService = new PedidoService(
      new PedidosRepository(),
    ),
  ) {}

  /**
   * Calcula o peso disponível em uma carga.
   * @param carga A carga para calcular
   * @returns O peso disponível na carga
   */
  async calculaPesoDisponivel(carga: Carga): Promise<number> {
    const cargaId = carga.id;
    const cargaData = await this.cargoRepository.getCargaById(cargaId);

    if (!cargaData) {
      throw new Error(`Carga ${cargaId} não encontrada`);
    }

    const pedidos = await this.cargoRepository.getPedidosPorCarga(carga.codCar);
    if (pedidos.length === 0) {
      return carga.pesoMaximo;
    }

    const pesoUsadoPedidos = await this.calcularPesoUsado(pedidos);

    const pesoDisponivel = carga.pesoMaximo - pesoUsadoPedidos;
    return pesoDisponivel;
  }

  /**
   * Calcula o peso total usado pelos pedidos (considera histórico primeiro).
   * @param pedidos Lista de pedidos
   * @returns O peso total usado
   */
  async calcularPesoUsado(pedidos: Pedido[]): Promise<number> {
    let pesoUsado = 0;

    for (const pedido of pedidos) {
      // Tenta buscar histórico primeiro
      const historico = await this.pedidoService.getUltimoHistoricoPeso(pedido);
      
      if (historico?.peso) {
        pesoUsado += historico.peso;
      } else {
        // Fallback: usa peso atual
        try {
          const pesoAtual = await this.pedidoService.pesoAtualPedido(pedido);
          pesoUsado += pesoAtual;
        } catch (error) {
          console.warn(`⚠️ Pedido ${pedido.numPed} com peso inválido, ignorando...`);
        }
      }
    }

    return pesoUsado;
  }

  /**
   * Simula o novo peso de uma carga ao adicionar ou atualizar um pedido.
   * @param carga A carga na qual o pedido será adicionado ou atualizado.
   * @param pedidos Lista de pedidos já adicionados à carga.
   * @param pedido O pedido que será adicionado ou atualizado na carga.
   * @returns Um objeto contendo informações sobre a simulação do novo peso na carga.
   */
  async simularNovoPeso(
    carga: Carga,
    pedidos: Pedido[],
    pedido: Pedido,
  ): Promise<SimulacaoPedidoNaCarga> {
    const historico = await this.pedidoService.getUltimoHistoricoPeso(pedido);
    const pesoAtualPedido = await this.pedidoService.pesoAtualPedido(pedido);
    const pesoUsadoAtual = await this.calcularPesoUsado(pedidos);

    if (pesoAtualPedido == null || isNaN(pesoAtualPedido)) {
      throw new Error(`Peso atual inválido para o pedido ${pedido.numPed}`);
    }

    const pesoAnteriorConsiderado = historico?.peso ?? pesoAtualPedido;
    const novoPesoUsado =
      pesoUsadoAtual - pesoAnteriorConsiderado + pesoAtualPedido;
    const pesoDisponivelAtual = carga.pesoMaximo - pesoUsadoAtual;
    const pesoDisponivelAposTroca = carga.pesoMaximo - novoPesoUsado;
    const cabeNaCarga = pesoDisponivelAposTroca >= 0;
    const excesso = cabeNaCarga ? 0 : Math.abs(pesoDisponivelAposTroca);

    return {
      pesoAnteriorConsiderado,
      pesoAtualPedido,
      pesoUsadoAtual,
      novoPesoUsado,
      pesoDisponivelAtual,
      pesoDisponivelAposTroca,
      cabeNaCarga,
      excesso,
    };
  }

  /**
   * Valida Se um pedido pode ser adicionado ou atualizado em uma carga, considerando o peso disponível e o peso do pedido.
   * @param carga 
   * @param novoPedido 
   * @returns 
   */
  async validarAdicaoPedido(
    carga: Carga,
    novoPedido: Pedido,
  ): Promise<ResultadoValidacaoPedidoNaCarga> {

    const pesoDisponivel = await this.calculaPesoDisponivel(carga);
    const pesoPedido = await this.pedidoService.pesoAtualPedido(novoPedido);

    if (pesoPedido == null || isNaN(pesoPedido)) {
      throw new Error(
        `Pedido ${novoPedido.numPed} com peso inválido: ${pesoPedido}`,
      );
    }

    const pesoTotalAposAdicionar =
      carga.pesoMaximo - pesoDisponivel + pesoPedido;
    const excesso =
      pesoTotalAposAdicionar > carga.pesoMaximo
        ? pesoTotalAposAdicionar - carga.pesoMaximo
        : 0;

    return {
      podeAdicionar: excesso === 0,
      pesoDisponivel,
      pesoPedido,
      pesoTotalAposAdicionar,
      excesso,
    };
  }
}
