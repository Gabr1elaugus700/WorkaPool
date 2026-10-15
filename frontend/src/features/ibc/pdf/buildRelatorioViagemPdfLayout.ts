import type { RelatorioViagemDTO } from "../types/ibcExpedicao.types";

const MARGEM_X = 14;
const MARGEM_TOPO = 18;
const FUNDO = 274;
const DIREITA = 196;
const CAIXA = 5;
const LARGURA_IBC = 40;
const LARGURA_MARCA = (DIREITA - MARGEM_X - LARGURA_IBC) / 3;

const MARCAS = ["Ficou no cliente", "Retornou no caminhão", "Troca"] as const;

const COLUNAS_PEDIDO = [
  { rotulo: "Pedido", x: MARGEM_X },
  { rotulo: "Quantidade", x: 56 },
  { rotulo: "Modalidade", x: 96 },
] as const;

const dataPt = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "America/Sao_Paulo",
});

const dataHoraPt = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: "America/Sao_Paulo",
});

type Alinhamento = "esquerda" | "centro";

type Texto = {
  tipo: "texto";
  texto: string;
  x: number;
  negrito: boolean;
  tamanho: number;
  alinhamento: Alinhamento;
};

type Caixa = { tipo: "caixa"; x: number; tamanho: number };

type PapelTraco = "motorista" | "assinatura" | "retorno" | "pauta" | "fio";

type Traco = { tipo: "traco"; papel: PapelTraco; x1: number; x2: number };

type Rascunho = Texto | Caixa | Traco;

export type RelatorioViagemPdfItem = Rascunho & { y: number };

export type RelatorioViagemPdfPagina = {
  itens: RelatorioViagemPdfItem[];
  rodape: string;
};

export type RelatorioViagemPdfLayout = {
  arquivo: string;
  paginas: RelatorioViagemPdfPagina[];
};

type Estado = {
  paginas: RelatorioViagemPdfItem[][];
  itens: RelatorioViagemPdfItem[];
  y: number;
};

function formatar(data: Date, comHora: boolean): string {
  const partes = (comHora ? dataHoraPt : dataPt).formatToParts(data);
  const valor = (tipo: Intl.DateTimeFormatPartTypes) =>
    partes.find((parte) => parte.type === tipo)?.value ?? "";
  const dia = `${valor("day")}/${valor("month")}/${valor("year")}`;
  return comHora ? `${dia} ${valor("hour")}:${valor("minute")}` : dia;
}

function formatarDataIso(iso: string): string {
  const data = new Date(iso);
  return Number.isNaN(data.getTime()) ? iso : formatar(data, false);
}

function centroMarca(indice: number): number {
  return MARGEM_X + LARGURA_IBC + LARGURA_MARCA * indice + LARGURA_MARCA / 2;
}

function nomeCliente(cliente: RelatorioViagemDTO["clientes"][number]): string {
  return cliente.codCli ? `${cliente.cliente} (${cliente.codCli})` : cliente.cliente;
}

function criarEstado(): Estado {
  return { paginas: [], itens: [], y: MARGEM_TOPO };
}

function colocar(estado: Estado, rascunho: Rascunho) {
  estado.itens.push({ ...rascunho, y: estado.y });
}

function texto(
  estado: Estado,
  conteudo: string,
  x: number,
  negrito: boolean,
  tamanho: number,
  alinhamento: Alinhamento = "esquerda",
) {
  colocar(estado, { tipo: "texto", texto: conteudo, x, negrito, tamanho, alinhamento });
}

function fio(estado: Estado, x1 = MARGEM_X, x2 = DIREITA) {
  colocar(estado, { tipo: "traco", papel: "fio", x1, x2 });
}

function quebrar(estado: Estado) {
  if (estado.itens.length === 0) return;
  estado.paginas.push(estado.itens);
  estado.itens = [];
  estado.y = MARGEM_TOPO;
}

function garantir(estado: Estado, altura: number, repetir?: () => void): boolean {
  if (estado.y + altura <= FUNDO || estado.itens.length === 0) return false;
  quebrar(estado);
  repetir?.();
  return true;
}

function emitirFaixa(estado: Estado, relatorio: RelatorioViagemDTO) {
  texto(estado, "Relatório de Viagem", MARGEM_X, true, 16);
  estado.y += 7;
  fio(estado);
  estado.y += 6;
  texto(estado, `Data: ${formatarDataIso(relatorio.fechadoEm)}`, MARGEM_X, false, 9);
  texto(estado, `Carga: ${relatorio.codCar}`, 62, false, 9);
  texto(estado, `Placa: ${relatorio.placa ?? "—"}`, 110, false, 9);
  estado.y += 5;
  texto(estado, `Total de IBCs: ${relatorio.totalIbcs}`, MARGEM_X, false, 9);
  texto(estado, `Total de clientes: ${relatorio.totalClientes}`, 70, false, 9);
  estado.y += 8;
  texto(estado, "Motorista", MARGEM_X, true, 10);
  texto(estado, "Assinatura", 108, true, 10);
  colocar(estado, { tipo: "traco", papel: "motorista", x1: 40, x2: 100 });
  colocar(estado, { tipo: "traco", papel: "assinatura", x1: 134, x2: DIREITA });
  estado.y += 4;
  fio(estado);
  estado.y += 8;
}

function emitirNome(estado: Estado, nome: string, tamanho = 12) {
  texto(estado, nome, MARGEM_X, true, tamanho);
  estado.y += 2;
  fio(estado);
  estado.y += 5;
}

function emitirCabecalhoPedidos(estado: Estado) {
  for (const coluna of COLUNAS_PEDIDO) {
    texto(estado, coluna.rotulo, coluna.x, true, 8);
  }
  estado.y += 5;
}

function emitirPedido(
  estado: Estado,
  pedido: RelatorioViagemDTO["clientes"][number]["pedidos"][number],
) {
  const valores = [pedido.numPed, String(pedido.quantidade), pedido.modalidade];
  COLUNAS_PEDIDO.forEach((coluna, indice) => {
    texto(estado, valores[indice] ?? "", coluna.x, false, 10);
  });
  estado.y += 5;
}

function emitirCabecalhoMarcas(estado: Estado) {
  texto(estado, "IBC", MARGEM_X, true, 8);
  MARCAS.forEach((marca, indice) => {
    texto(estado, marca, centroMarca(indice), true, 8, "centro");
  });
  estado.y += 1.6;
  fio(estado);
  estado.y += 5.4;
}

function emitirLinhaIbc(estado: Estado, identificador: string) {
  texto(estado, identificador, MARGEM_X, false, 10);
  for (let indice = 0; indice < MARCAS.length; indice += 1) {
    colocar(estado, {
      tipo: "caixa",
      x: centroMarca(indice) - CAIXA / 2,
      tamanho: CAIXA,
    });
  }
  estado.y += 8;
}

function emitirRetorno(estado: Estado) {
  texto(estado, "Retornos sem identificação", MARGEM_X, false, 10);
  colocar(estado, { tipo: "traco", papel: "retorno", x1: 68, x2: 100 });
  estado.y += 8;
}

function emitirObservacoes(estado: Estado) {
  texto(estado, "Observações", MARGEM_X, true, 10);
  estado.y += 6;
  colocar(estado, { tipo: "traco", papel: "pauta", x1: MARGEM_X, x2: DIREITA });
  estado.y += 8;
  colocar(estado, { tipo: "traco", papel: "pauta", x1: MARGEM_X, x2: DIREITA });
  estado.y += 8;
}

function emitirCliente(estado: Estado, cliente: RelatorioViagemDTO["clientes"][number]) {
  const nome = nomeCliente(cliente);
  if (estado.y > MARGEM_TOPO + 1) estado.y += 4;

  const alturaPedido = cliente.pedidos.length > 0 ? 5 : 0;
  garantir(estado, 7 + 5 + alturaPedido);
  emitirNome(estado, nome);
  emitirCabecalhoPedidos(estado);
  for (const pedido of cliente.pedidos) {
    garantir(estado, 5, () => {
      emitirNome(estado, nome, 11);
      emitirCabecalhoPedidos(estado);
    });
    emitirPedido(estado, pedido);
  }

  estado.y += 2;
  const continuarMarcas = () => {
    emitirNome(estado, nome, 11);
    emitirCabecalhoMarcas(estado);
  };
  if (!garantir(estado, 7 + 8, continuarMarcas)) emitirCabecalhoMarcas(estado);
  for (const ibc of cliente.checklist) {
    garantir(estado, 8, continuarMarcas);
    emitirLinhaIbc(estado, ibc.identificador);
  }

  garantir(estado, 8 + 6 + 8 + 8, () => emitirNome(estado, nome, 11));
  emitirRetorno(estado);
  emitirObservacoes(estado);
}

function paginar(relatorio: RelatorioViagemDTO): RelatorioViagemPdfItem[][] {
  const estado = criarEstado();
  emitirFaixa(estado, relatorio);
  for (const cliente of relatorio.clientes) emitirCliente(estado, cliente);
  if (estado.itens.length > 0) estado.paginas.push(estado.itens);
  return estado.paginas;
}

export function buildRelatorioViagemPdfLayout(
  relatorio: RelatorioViagemDTO,
  emitidoEm: Date,
): RelatorioViagemPdfLayout {
  const paginas = paginar(relatorio);
  const emitido = formatar(emitidoEm, true);

  return {
    arquivo: `relatorio-viagem-${relatorio.codCar}.pdf`,
    paginas: paginas.map((itens, indice) => ({
      itens,
      rodape: `Página ${indice + 1} de ${paginas.length} · Emitido em ${emitido}`,
    })),
  };
}
