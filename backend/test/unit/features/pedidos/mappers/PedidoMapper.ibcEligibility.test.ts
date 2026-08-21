import { describe, it, after } from 'node:test';
import assert from 'node:assert/strict';
import { mapRawToPedidos } from '../../../../../src/features/pedidos/mappers/PedidoMapper';
import { PedidoRaw } from '../../../../../src/features/pedidos/types/PedidoRaw';

const CODIGO_EMBALAGEM_IBC = 251001;

const buildRow = (overrides: Partial<PedidoRaw> = {}): PedidoRaw => ({
  NUM_PED: '1120',
  COD_CLI: 'C1',
  CLIENTE: 'Cliente Teste',
  CIDADE: 'Blumenau',
  ESTADO: 'SC',
  VENDEDOR: 'Vendedor Teste',
  CODREP: 1,
  BLOQUEADO: 'N',
  PESO: 100,
  PRODUTOS: 'Produto',
  DERIVACAO: '001',
  QUANTIDADE: 1,
  CODCAR: 10,
  POSCAR: 1,
  SITCAR: 'ABERTA',
  QTD_ORI_PED: 1,
  ...overrides,
});

describe('mapRawToPedidos — elegibilidade IBC (#58)', () => {
  after(async () => {
    await new Promise((resolve) => setImmediate(resolve));
    await new Promise((resolve) => setTimeout(resolve, 100));
  });

  it('calcula quantidadeEsperadaTotal = QUANTIDADE_PEDIDO / VOLUME_EMBALAGEM em linha 251001', () => {
    const rows: PedidoRaw[] = [
      buildRow({
        CODIGO_EMBALAGEM: CODIGO_EMBALAGEM_IBC,
        QUANTIDADE: 3000,
        VOLUME_EMBALAGEM: 1000,
        INCLUSO: 'N',
      }),
    ];

    const [pedido] = mapRawToPedidos(rows);

    assert.equal(pedido.isContainer, true);
    assert.equal(pedido.quantidadeEsperadaTotal, 3);
    assert.equal(pedido.ibcInvalido, false);
  });

  it('soma múltiplas linhas 251001 no mesmo pedido', () => {
    const rows: PedidoRaw[] = [
      buildRow({
        DERIVACAO: '001',
        CODIGO_EMBALAGEM: CODIGO_EMBALAGEM_IBC,
        QUANTIDADE: 2000,
        VOLUME_EMBALAGEM: 1000,
        INCLUSO: 'N',
      }),
      buildRow({
        DERIVACAO: '002',
        CODIGO_EMBALAGEM: CODIGO_EMBALAGEM_IBC,
        QUANTIDADE: 1000,
        VOLUME_EMBALAGEM: 1000,
        INCLUSO: 'N',
      }),
    ];

    const [pedido] = mapRawToPedidos(rows);

    assert.equal(pedido.quantidadeEsperadaTotal, 3);
    assert.equal(pedido.isContainer, true);
  });

  it('expõe split Venda (INCLUSO S) e Empréstimo (demais) no mesmo pedido', () => {
    const rows: PedidoRaw[] = [
      buildRow({
        DERIVACAO: '001',
        CODIGO_EMBALAGEM: CODIGO_EMBALAGEM_IBC,
        QUANTIDADE: 2000,
        VOLUME_EMBALAGEM: 1000,
        INCLUSO: 'S',
      }),
      buildRow({
        DERIVACAO: '002',
        CODIGO_EMBALAGEM: CODIGO_EMBALAGEM_IBC,
        QUANTIDADE: 1000,
        VOLUME_EMBALAGEM: 1000,
        INCLUSO: 'N',
      }),
    ];

    const [pedido] = mapRawToPedidos(rows);

    assert.equal(pedido.quantidadeEsperadaVenda, 2);
    assert.equal(pedido.quantidadeEsperadaEmprestimo, 1);
    assert.equal(pedido.quantidadeEsperadaTotal, 3);
  });

  it('INCLUSO null ou lixo em linha 251001 conta como Empréstimo', () => {
    const rows: PedidoRaw[] = [
      buildRow({
        CODIGO_EMBALAGEM: CODIGO_EMBALAGEM_IBC,
        QUANTIDADE: 2000,
        VOLUME_EMBALAGEM: 1000,
        INCLUSO: null,
      }),
      buildRow({
        NUM_PED: '1121',
        CODIGO_EMBALAGEM: CODIGO_EMBALAGEM_IBC,
        QUANTIDADE: 1000,
        VOLUME_EMBALAGEM: 1000,
        INCLUSO: '  x ',
      }),
    ];

    const pedidos = mapRawToPedidos(rows);
    const p1120 = pedidos.find((p) => p.numPed === '1120');
    const p1121 = pedidos.find((p) => p.numPed === '1121');

    assert.equal(p1120?.quantidadeEsperadaVenda, 0);
    assert.equal(p1120?.quantidadeEsperadaEmprestimo, 2);
    assert.equal(p1121?.quantidadeEsperadaVenda, 0);
    assert.equal(p1121?.quantidadeEsperadaEmprestimo, 1);
  });

  it('INCLUSO " s " (trim/upper) conta como Venda', () => {
    const rows: PedidoRaw[] = [
      buildRow({
        CODIGO_EMBALAGEM: CODIGO_EMBALAGEM_IBC,
        QUANTIDADE: 1000,
        VOLUME_EMBALAGEM: 1000,
        INCLUSO: ' s ',
      }),
    ];

    const [pedido] = mapRawToPedidos(rows);

    assert.equal(pedido.quantidadeEsperadaVenda, 1);
    assert.equal(pedido.quantidadeEsperadaEmprestimo, 0);
  });

  it('marca Pedido IBC inválido quando VOLUME_EMBALAGEM é zero e sinaliza alerta ALMOX', () => {
    const rows: PedidoRaw[] = [
      buildRow({
        NUM_PED: '1120',
        CODIGO_EMBALAGEM: CODIGO_EMBALAGEM_IBC,
        QUANTIDADE: 10,
        VOLUME_EMBALAGEM: 0,
        INCLUSO: 'N',
      }),
      buildRow({
        NUM_PED: '1121',
        CODIGO_EMBALAGEM: CODIGO_EMBALAGEM_IBC,
        QUANTIDADE: 1000,
        VOLUME_EMBALAGEM: 1000,
        INCLUSO: 'N',
      }),
    ];

    const pedidos = mapRawToPedidos(rows);
    const invalido = pedidos.find((p) => p.numPed === '1120');
    const elegivel = pedidos.find((p) => p.numPed === '1121');

    assert.equal(invalido?.ibcInvalido, true);
    assert.equal(invalido?.isContainer, false);
    assert.equal(invalido?.quantidadeEsperadaTotal, 0);
    assert.equal(elegivel?.ibcInvalido, false);
    assert.equal(elegivel?.isContainer, true);
    assert.equal(elegivel?.quantidadeEsperadaTotal, 1);
  });

  it('marca Pedido IBC inválido quando a divisão não é inteira', () => {
    const rows: PedidoRaw[] = [
      buildRow({
        CODIGO_EMBALAGEM: CODIGO_EMBALAGEM_IBC,
        QUANTIDADE: 10,
        VOLUME_EMBALAGEM: 3,
        INCLUSO: 'N',
      }),
    ];

    const [pedido] = mapRawToPedidos(rows);

    assert.equal(pedido.ibcInvalido, true);
    assert.equal(pedido.isContainer, false);
    assert.equal(pedido.quantidadeEsperadaTotal, 0);
  });

  it('linhas não-251001 não entram no cálculo e ignoram INCLUSO', () => {
    const rows: PedidoRaw[] = [
      buildRow({
        DERIVACAO: '001',
        CODIGO_EMBALAGEM: 999999,
        QUANTIDADE: 5000,
        VOLUME_EMBALAGEM: 1000,
        INCLUSO: 'S',
      }),
      buildRow({
        DERIVACAO: '002',
        CODIGO_EMBALAGEM: CODIGO_EMBALAGEM_IBC,
        QUANTIDADE: 1000,
        VOLUME_EMBALAGEM: 1000,
        INCLUSO: 'N',
      }),
    ];

    const [pedido] = mapRawToPedidos(rows);

    assert.equal(pedido.quantidadeEsperadaTotal, 1);
    assert.equal(pedido.quantidadeEsperadaVenda, 0);
    assert.equal(pedido.quantidadeEsperadaEmprestimo, 1);
    assert.equal(pedido.isContainer, true);
  });

  it('pedido sem linhas 251001 não é elegível a IBC', () => {
    const rows: PedidoRaw[] = [
      buildRow({
        CODIGO_EMBALAGEM: 123456,
        QUANTIDADE: 10,
        VOLUME_EMBALAGEM: 1,
        INCLUSO: 'S',
      }),
    ];

    const [pedido] = mapRawToPedidos(rows);

    assert.equal(pedido.isContainer, false);
    assert.equal(pedido.ibcInvalido, false);
    assert.equal(pedido.quantidadeEsperadaTotal, 0);
  });

  it('linha inválida invalida o pedido inteiro sem somar linhas 251001 válidas', () => {
    const rows: PedidoRaw[] = [
      buildRow({
        DERIVACAO: '001',
        CODIGO_EMBALAGEM: CODIGO_EMBALAGEM_IBC,
        QUANTIDADE: 2000,
        VOLUME_EMBALAGEM: 1000,
        INCLUSO: 'S',
      }),
      buildRow({
        DERIVACAO: '002',
        CODIGO_EMBALAGEM: CODIGO_EMBALAGEM_IBC,
        QUANTIDADE: 10,
        VOLUME_EMBALAGEM: 0,
        INCLUSO: 'N',
      }),
    ];

    const [pedido] = mapRawToPedidos(rows);

    assert.equal(pedido.ibcInvalido, true);
    assert.equal(pedido.isContainer, false);
    assert.equal(pedido.quantidadeEsperadaTotal, 0);
    assert.equal(pedido.quantidadeEsperadaVenda, 0);
    assert.equal(pedido.quantidadeEsperadaEmprestimo, 0);
  });

  it('sem campos de embalagem (queries BASE/rep) deixa IBC zerado', () => {
    const rows: PedidoRaw[] = [buildRow({ QUANTIDADE: 5 })];

    const [pedido] = mapRawToPedidos(rows);

    assert.equal(pedido.isContainer, false);
    assert.equal(pedido.ibcInvalido, false);
    assert.equal(pedido.quantidadeEsperadaTotal, 0);
  });
});
