import { describe, it, mock, after } from 'node:test';
import assert from 'node:assert/strict';
import { CargaProcessor } from '../../../../../src/features/cargo/services/CargaProcessor';
import { Carga, SituacaoCarga } from '../../../../../src/features/cargo/entities/Carga';
import { Pedido } from '../../../../../src/features/cargo/entities/Pedido';
import { ICargoRepository } from '../../../../../src/features/cargo/repositories/ICargoRepository';
import { PesoCargaCalculator } from '../../../../../src/features/cargo/services/PesoCargaCalculator';
import { PedidoService } from '../../../../../src/features/pedidos/services/PedidoService';

const buildCarga = (codCar = 10): Carga =>
  new Carga({
    id: 'carga-1',
    codCar,
    destino: 'Blumenau',
    pesoMaximo: 10000,
    previsaoSaida: new Date('2026-03-25T10:00:00.000Z'),
    situacao: SituacaoCarga.ABERTA,
  });

const buildPedido = (numPed: string, poscar: number | null = null): Pedido =>
  new Pedido({
    id: numPed,
    numPed,
    cliente: 'Cliente Teste',
    cidade: 'Blumenau',
    estado: 'SC',
    vendedor: 'Vendedor Teste',
    peso: 100,
    qtdOri: 1,
    codCar: 10,
    poscar,
  });

describe('CargaProcessor.processarMudancasPesoPedidos', () => {
  after(async () => {
    // Aguarda múltiplos ticks para permitir que promises pendentes sejam resolvidas
    await new Promise((resolve) => setImmediate(resolve));
    await new Promise((resolve) => setTimeout(resolve, 100));
  });

  describe('TC-P1 - reposiciona quando o peso aumenta e cabe', () => {
    it('TC-P1.1 - aumentou e cabe => reposiciona e grava histórico', async () => {
      // Arrange
      const carga = buildCarga(10);
      const pedidos = [buildPedido('1', 1)];

      const getPedidosPorCarga = mock.fn(async (_codCar: number) => pedidos);
      const updatePedidoCarga = mock.fn(
        async (_numPed: number, _codCar: number, _posCar: number) => {},
      );
      const cargoRepository: ICargoRepository = {
        getPedidosPorCarga,
        updatePedidoCarga,
      } as any;

      const simularNovoPeso = mock.fn(async () => ({ cabeNaCarga: true }));
      const pesoCargaCalculator: PesoCargaCalculator = {
        simularNovoPeso,
        calculaPesoDisponivel: mock.fn(async () => 5000),
      } as any;

      const verificarMudancaPeso = mock.fn(async () => ({
        mudou: true,
        aumentou: true,
        reducao: false,
        pesoAnterior: 400,
        pesoAtual: 500,
        diferenca: 100,
      }));
      const salvarHistoricoPeso = mock.fn(
        async (_pedido: Pedido, _cargaId: string, _peso: number) => {},
      );
      const pedidoService: PedidoService = {
        verificarMudancaPeso,
        salvarHistoricoPeso,
      } as any;

      const processor = new CargaProcessor(
        cargoRepository,
        pesoCargaCalculator,
        pedidoService,
      );

      // Act
      const resultado = await processor.processarMudancasPesoPedidos(carga);

      // Assert
      assert.strictEqual(updatePedidoCarga.mock.calls.length, 1);
      assert.strictEqual(updatePedidoCarga.mock.calls[0].arguments[0], 1);
      assert.strictEqual(updatePedidoCarga.mock.calls[0].arguments[2], 2); // maxPosCar(1) + 1

      assert.strictEqual(salvarHistoricoPeso.mock.calls.length, 1);
      assert.strictEqual(salvarHistoricoPeso.mock.calls[0].arguments[2], 500);

      assert.deepStrictEqual(resultado.pedidosReposicionados, [1]);
      assert.deepStrictEqual(resultado.pedidosRemovidos, []);
    });

    it('TC-P1.2 - aumentou e não cabe => remove e grava histórico', async () => {
      // Arrange
      const carga = buildCarga(10);
      const pedidos = [buildPedido('1', 1)];

      const getPedidosPorCarga = mock.fn(async (_codCar: number) => pedidos);
      const updatePedidoCarga = mock.fn(
        async (_numPed: number, _codCar: number, _posCar: number) => {},
      );
      const cargoRepository: ICargoRepository = {
        getPedidosPorCarga,
        updatePedidoCarga,
      } as any;

      const simularNovoPeso = mock.fn(async () => ({
        cabeNaCarga: false,
        excesso: 120,
      }));
      const pesoCargaCalculator: PesoCargaCalculator = {
        simularNovoPeso,
        calculaPesoDisponivel: mock.fn(async () => 0),
      } as any;

      const verificarMudancaPeso = mock.fn(async () => ({
        mudou: true,
        aumentou: true,
        reducao: false,
        pesoAnterior: 400,
        pesoAtual: 500,
        diferenca: 100,
      }));
      const salvarHistoricoPeso = mock.fn(
        async (_pedido: Pedido, _cargaId: string, _peso: number) => {},
      );
      const pedidoService: PedidoService = {
        verificarMudancaPeso,
        salvarHistoricoPeso,
      } as any;

      const processor = new CargaProcessor(
        cargoRepository,
        pesoCargaCalculator,
        pedidoService,
      );

      // Act
      const resultado = await processor.processarMudancasPesoPedidos(carga);

      // Assert
      assert.strictEqual(updatePedidoCarga.mock.calls.length, 1);
      assert.deepStrictEqual(updatePedidoCarga.mock.calls[0].arguments, [1, 0, 0]);

      assert.strictEqual(salvarHistoricoPeso.mock.calls.length, 1);
      assert.strictEqual(salvarHistoricoPeso.mock.calls[0].arguments[2], 500);

      assert.deepStrictEqual(resultado.pedidosRemovidos, [1]);
      assert.deepStrictEqual(resultado.pedidosReposicionados, []);
    });

    it('TC-P1.3 - reduziu => apenas grava histórico, sem reposicionar/remover', async () => {
      // Arrange
      const carga = buildCarga(10);
      const pedidos = [buildPedido('1', 1)];

      const getPedidosPorCarga = mock.fn(async (_codCar: number) => pedidos);
      const updatePedidoCarga = mock.fn(
        async (_numPed: number, _codCar: number, _posCar: number) => {},
      );
      const cargoRepository: ICargoRepository = {
        getPedidosPorCarga,
        updatePedidoCarga,
      } as any;

      const simularNovoPeso = mock.fn(async () => ({ cabeNaCarga: true }));
      const pesoCargaCalculator: PesoCargaCalculator = {
        simularNovoPeso,
        calculaPesoDisponivel: mock.fn(async () => 5000),
      } as any;

      const verificarMudancaPeso = mock.fn(async () => ({
        mudou: true,
        aumentou: false,
        reducao: true,
        pesoAnterior: 500,
        pesoAtual: 300,
        diferenca: -200,
      }));
      const salvarHistoricoPeso = mock.fn(
        async (_pedido: Pedido, _cargaId: string, _peso: number) => {},
      );
      const pedidoService: PedidoService = {
        verificarMudancaPeso,
        salvarHistoricoPeso,
      } as any;

      const processor = new CargaProcessor(
        cargoRepository,
        pesoCargaCalculator,
        pedidoService,
      );

      // Act
      const resultado = await processor.processarMudancasPesoPedidos(carga);

      // Assert
      assert.strictEqual(updatePedidoCarga.mock.calls.length, 0);
      assert.strictEqual(simularNovoPeso.mock.calls.length, 0);

      assert.strictEqual(salvarHistoricoPeso.mock.calls.length, 1);
      assert.strictEqual(salvarHistoricoPeso.mock.calls[0].arguments[2], 300);

      assert.deepStrictEqual(resultado.pedidosReposicionados, []);
      assert.deepStrictEqual(resultado.pedidosRemovidos, []);
    });

    it('TC-P1.4 - sem mudança => não atualiza carga nem grava histórico', async () => {
      // Arrange
      const carga = buildCarga(10);
      const pedidos = [buildPedido('1', 1)];

      const getPedidosPorCarga = mock.fn(async (_codCar: number) => pedidos);
      const updatePedidoCarga = mock.fn(
        async (_numPed: number, _codCar: number, _posCar: number) => {},
      );
      const cargoRepository: ICargoRepository = {
        getPedidosPorCarga,
        updatePedidoCarga,
      } as any;

      const simularNovoPeso = mock.fn(async () => ({ cabeNaCarga: true }));
      const pesoCargaCalculator: PesoCargaCalculator = {
        simularNovoPeso,
        calculaPesoDisponivel: mock.fn(async () => 5000),
      } as any;

      const verificarMudancaPeso = mock.fn(async () => ({
        mudou: false,
        aumentou: false,
        reducao: false,
        pesoAnterior: 500,
        pesoAtual: 500,
        diferenca: 0,
      }));
      const salvarHistoricoPeso = mock.fn(
        async (_pedido: Pedido, _cargaId: string, _peso: number) => {},
      );
      const pedidoService: PedidoService = {
        verificarMudancaPeso,
        salvarHistoricoPeso,
      } as any;

      const processor = new CargaProcessor(
        cargoRepository,
        pesoCargaCalculator,
        pedidoService,
      );

      // Act
      const resultado = await processor.processarMudancasPesoPedidos(carga);

      // Assert
      assert.strictEqual(updatePedidoCarga.mock.calls.length, 0);
      assert.strictEqual(salvarHistoricoPeso.mock.calls.length, 0);

      assert.deepStrictEqual(resultado.pedidosReposicionados, []);
      assert.deepStrictEqual(resultado.pedidosRemovidos, []);
      assert.deepStrictEqual(resultado.pedidosSemHistorico, []);
    });

    it('TC-P1.5 - sem histórico anterior => registro inicial, sem reposicionar', async () => {
      // Arrange
      const carga = buildCarga(10);
      const pedidos = [buildPedido('1', 1)];

      const getPedidosPorCarga = mock.fn(async (_codCar: number) => pedidos);
      const updatePedidoCarga = mock.fn(
        async (_numPed: number, _codCar: number, _posCar: number) => {},
      );
      const cargoRepository: ICargoRepository = {
        getPedidosPorCarga,
        updatePedidoCarga,
      } as any;

      const simularNovoPeso = mock.fn(async () => ({ cabeNaCarga: true }));
      const pesoCargaCalculator: PesoCargaCalculator = {
        simularNovoPeso,
        calculaPesoDisponivel: mock.fn(async () => 5000),
      } as any;

      const verificarMudancaPeso = mock.fn(async () => ({
        mudou: false,
        aumentou: false,
        reducao: false,
        pesoAnterior: null,
        pesoAtual: 500,
        diferenca: 0,
      }));
      const salvarHistoricoPeso = mock.fn(
        async (_pedido: Pedido, _cargaId: string, _peso: number) => {},
      );
      const pedidoService: PedidoService = {
        verificarMudancaPeso,
        salvarHistoricoPeso,
      } as any;

      const processor = new CargaProcessor(
        cargoRepository,
        pesoCargaCalculator,
        pedidoService,
      );

      // Act
      const resultado = await processor.processarMudancasPesoPedidos(carga);

      // Assert
      assert.strictEqual(updatePedidoCarga.mock.calls.length, 0);
      assert.strictEqual(salvarHistoricoPeso.mock.calls.length, 1);

      assert.deepStrictEqual(resultado.pedidosSemHistorico, [1]);
      assert.deepStrictEqual(resultado.pedidosReposicionados, []);
      assert.deepStrictEqual(resultado.pedidosRemovidos, []);
    });
  });

  describe('TC-P2 - moverPedidoParaFinal calcula posição corretamente', () => {
    it('TC-P2.1 - poscar 1, 2, 5 => nova posição 6', async () => {
      // Arrange
      const carga = buildCarga(10);
      const pedidos = [
        buildPedido('1', 1),
        buildPedido('2', 2),
        buildPedido('3', 5),
      ];

      const getPedidosPorCarga = mock.fn(async (_codCar: number) => pedidos);
      const updatePedidoCarga = mock.fn(
        async (_numPed: number, _codCar: number, _posCar: number) => {},
      );
      const cargoRepository: ICargoRepository = {
        getPedidosPorCarga,
        updatePedidoCarga,
      } as any;

      const simularNovoPeso = mock.fn(async () => ({ cabeNaCarga: true }));
      const pesoCargaCalculator: PesoCargaCalculator = {
        simularNovoPeso,
        calculaPesoDisponivel: mock.fn(async () => 5000),
      } as any;

      const verificarMudancaPeso = mock.fn(async (pedido: Pedido) =>
        pedido.numPed === '1'
          ? {
              mudou: true,
              aumentou: true,
              reducao: false,
              pesoAnterior: 400,
              pesoAtual: 500,
              diferenca: 100,
            }
          : {
              mudou: false,
              aumentou: false,
              reducao: false,
              pesoAnterior: 100,
              pesoAtual: 100,
              diferenca: 0,
            },
      );
      const salvarHistoricoPeso = mock.fn(
        async (_pedido: Pedido, _cargaId: string, _peso: number) => {},
      );
      const pedidoService: PedidoService = {
        verificarMudancaPeso,
        salvarHistoricoPeso,
      } as any;

      const processor = new CargaProcessor(
        cargoRepository,
        pesoCargaCalculator,
        pedidoService,
      );

      // Act
      await processor.processarMudancasPesoPedidos(carga);

      // Assert
      assert.strictEqual(updatePedidoCarga.mock.calls.length, 1);
      assert.strictEqual(updatePedidoCarga.mock.calls[0].arguments[0], 1);
      assert.strictEqual(updatePedidoCarga.mock.calls[0].arguments[2], 6);
    });

    it('TC-P2.2 - sem poscar definido (null/0) => nova posição 1', async () => {
      // Arrange
      const carga = buildCarga(10);
      const pedidos = [buildPedido('1', null)];

      const getPedidosPorCarga = mock.fn(async (_codCar: number) => pedidos);
      const updatePedidoCarga = mock.fn(
        async (_numPed: number, _codCar: number, _posCar: number) => {},
      );
      const cargoRepository: ICargoRepository = {
        getPedidosPorCarga,
        updatePedidoCarga,
      } as any;

      const simularNovoPeso = mock.fn(async () => ({ cabeNaCarga: true }));
      const pesoCargaCalculator: PesoCargaCalculator = {
        simularNovoPeso,
        calculaPesoDisponivel: mock.fn(async () => 5000),
      } as any;

      const verificarMudancaPeso = mock.fn(async () => ({
        mudou: true,
        aumentou: true,
        reducao: false,
        pesoAnterior: 400,
        pesoAtual: 500,
        diferenca: 100,
      }));
      const salvarHistoricoPeso = mock.fn(
        async (_pedido: Pedido, _cargaId: string, _peso: number) => {},
      );
      const pedidoService: PedidoService = {
        verificarMudancaPeso,
        salvarHistoricoPeso,
      } as any;

      const processor = new CargaProcessor(
        cargoRepository,
        pesoCargaCalculator,
        pedidoService,
      );

      // Act
      await processor.processarMudancasPesoPedidos(carga);

      // Assert
      assert.strictEqual(updatePedidoCarga.mock.calls.length, 1);
      assert.strictEqual(updatePedidoCarga.mock.calls[0].arguments[0], 1);
      assert.strictEqual(updatePedidoCarga.mock.calls[0].arguments[2], 1);
    });
  });
});
