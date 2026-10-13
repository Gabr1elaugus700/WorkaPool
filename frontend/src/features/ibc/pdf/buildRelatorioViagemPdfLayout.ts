import type { RelatorioViagemDTO } from "../types/ibcExpedicao.types";

const MARGIN_TOP = 16;
const LINE = 5;
const BOTTOM = 283;
const COLUNAS = ["Ficou no cliente", "Retornou no caminhão", "Troca"] as const;

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

type Texto = { tipo: "texto"; texto: string; negrito: boolean; tamanho: number };
type Cabecalho = { tipo: "checklist-cabecalho"; colunas: readonly string[] };
type Check = { tipo: "checklist"; identificador: string };
type Observacao = { tipo: "observacao" };
type Rascunho = Texto | Cabecalho | Check | Observacao;

export type RelatorioViagemPdfLinha = Rascunho & { y: number };

export type RelatorioViagemPdfPagina = {
  linhas: RelatorioViagemPdfLinha[];
  rodape: string;
};

export type RelatorioViagemPdfLayout = {
  arquivo: string;
  paginas: RelatorioViagemPdfPagina[];
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

function texto(conteudo: string, negrito = false, tamanho = 10): Texto {
  return { tipo: "texto", texto: conteudo, negrito, tamanho };
}

function linhasDoCliente(cliente: RelatorioViagemDTO["clientes"][number]): Rascunho[] {
  const codigo = cliente.codCli ? ` (${cliente.codCli})` : "";
  const linhas: Rascunho[] = [
    texto(`${cliente.cliente}${codigo}`, true, 12),
    texto("Pedido    Quantidade    Modalidade", true, 9),
  ];
  for (const pedido of cliente.pedidos) {
    linhas.push(texto(`${pedido.numPed}    ${pedido.quantidade}    ${pedido.modalidade}`));
  }
  linhas.push({ tipo: "checklist-cabecalho", colunas: COLUNAS });
  for (const ibc of cliente.checklist) {
    linhas.push({ tipo: "checklist", identificador: ibc.identificador });
  }
  linhas.push(texto("Retornos sem identificação: ____"));
  linhas.push(texto("Observações:"));
  linhas.push({ tipo: "observacao" }, { tipo: "observacao" }, texto(""));
  return linhas;
}

function paginar(rascunhos: Rascunho[]): RelatorioViagemPdfLinha[][] {
  const paginas: RelatorioViagemPdfLinha[][] = [];
  let linhas: RelatorioViagemPdfLinha[] = [];
  let y = MARGIN_TOP;

  const quebrar = () => {
    paginas.push(linhas);
    linhas = [];
    y = MARGIN_TOP;
  };

  for (const rascunho of rascunhos) {
    if (y + LINE > BOTTOM) {
      quebrar();
      if (rascunho.tipo === "checklist") {
        linhas.push({ tipo: "checklist-cabecalho", colunas: COLUNAS, y });
        y += LINE;
      }
    }
    linhas.push({ ...rascunho, y });
    y += LINE;
  }

  if (linhas.length > 0) paginas.push(linhas);
  return paginas;
}

export function buildRelatorioViagemPdfLayout(
  relatorio: RelatorioViagemDTO,
  emitidoEm: Date,
): RelatorioViagemPdfLayout {
  const cabecalho: Rascunho[] = [
    texto("Relatório de Viagem", true, 16),
    texto(`Data: ${formatarDataIso(relatorio.fechadoEm)}`),
    texto(`Carga: ${relatorio.codCar}`),
    texto(`Placa: ${relatorio.placa ?? "—"}`),
    texto(`Total de IBCs: ${relatorio.totalIbcs}`),
    texto(`Total de clientes: ${relatorio.totalClientes}`),
    texto("Motorista: ____"),
    texto("Assinatura: ____"),
    texto(""),
  ];
  const corpo = relatorio.clientes.flatMap(linhasDoCliente);
  const paginas = paginar([...cabecalho, ...corpo]);
  const emitido = formatar(emitidoEm, true);

  return {
    arquivo: `relatorio-viagem-${relatorio.codCar}.pdf`,
    paginas: paginas.map((linhas, indice) => ({
      linhas,
      rodape: `Página ${indice + 1} de ${paginas.length} · Emitido em ${emitido}`,
    })),
  };
}
