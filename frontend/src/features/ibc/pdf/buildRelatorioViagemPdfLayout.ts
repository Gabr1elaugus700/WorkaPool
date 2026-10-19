import type { RelatorioViagemDTO } from "../types/ibcExpedicao.types";

const MARGEM_X = 14;
const MARGEM_TOPO = 18;
const FUNDO = 274;
const DIREITA = 196;
const CAIXA = 5;
const LARGURA_IBC = 34;
const LARGURA_BADGE = 22;
const LARGURA_MARCA = (DIREITA - MARGEM_X - LARGURA_IBC - LARGURA_BADGE) / 2;

const MARCAS = ["Ficou no cliente", "Troca"] as const;

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

type Selo = { tipo: "selo"; x: number; largura: number; altura: number };

type PapelTraco = "motorista" | "assinatura" | "pauta" | "fio";

type Traco = { tipo: "traco"; papel: PapelTraco; x1: number; x2: number };

type Rascunho = Texto | Caixa | Selo | Traco;

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
  return MARGEM_X + LARGURA_IBC + LARGURA_BADGE + LARGURA_MARCA * indice + LARGURA_MARCA / 2;
}

function centroBadge(): number {
  return MARGEM_X + LARGURA_IBC + LARGURA_BADGE / 2;
}

function nomeCliente(bloco: RelatorioViagemDTO["blocos"][number]): string {
  return bloco.codCli ? `${bloco.cliente} (${bloco.codCli})` : bloco.cliente;
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

function emitirResumoPedido(estado: Estado, bloco: RelatorioViagemDTO["blocos"][number]) {
  texto(estado, `Pedido ${bloco.numPed}`, MARGEM_X, false, 10);
  texto(estado, `Quantidade ${bloco.quantidadeEsperada}`, 70, false, 10);
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

function emitirSeloIncluso(estado: Estado) {
  const largura = 18;
  const altura = 4.4;
  colocar(estado, {
    tipo: "selo",
    x: centroBadge() - largura / 2,
    largura,
    altura,
  });
  texto(estado, "Incluso", centroBadge(), true, 7, "centro");
}

function emitirLinhaIbc(estado: Estado, identificador: string, incluso: boolean) {
  texto(estado, identificador, MARGEM_X, false, 10);
  if (incluso) emitirSeloIncluso(estado);
  for (let indice = 0; indice < MARCAS.length; indice += 1) {
    colocar(estado, {
      tipo: "caixa",
      x: centroMarca(indice) - CAIXA / 2,
      tamanho: CAIXA,
    });
  }
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

function repetirBloco(estado: Estado, nome: string, numPed: string) {
  emitirNome(estado, nome, 11);
  texto(estado, `Pedido ${numPed}`, MARGEM_X, false, 9);
  estado.y += 4;
}

function emitirBloco(estado: Estado, bloco: RelatorioViagemDTO["blocos"][number]) {
  const nome = nomeCliente(bloco);
  if (estado.y > MARGEM_TOPO + 1) estado.y += 4;

  garantir(estado, 7 + 5);
  emitirNome(estado, nome);
  emitirResumoPedido(estado, bloco);

  estado.y += 2;
  const continuarMarcas = () => {
    repetirBloco(estado, nome, bloco.numPed);
    emitirCabecalhoMarcas(estado);
  };
  if (!garantir(estado, 7 + 8, continuarMarcas)) emitirCabecalhoMarcas(estado);
  for (const ibc of bloco.checklist) {
    garantir(estado, 8, continuarMarcas);
    emitirLinhaIbc(estado, ibc.identificador, bloco.incluso);
  }

  garantir(estado, 6 + 8 + 8, () => repetirBloco(estado, nome, bloco.numPed));
  emitirObservacoes(estado);
}

function paginar(relatorio: RelatorioViagemDTO): RelatorioViagemPdfItem[][] {
  const estado = criarEstado();
  emitirFaixa(estado, relatorio);
  for (const bloco of relatorio.blocos) emitirBloco(estado, bloco);
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
