import type {
  EmprestimoAtrasado,
  EscopoLeituraEmprestimosAtrasados,
  LinhaEmprestimoAtrasado,
} from "../types/EmprestimoAtrasado.types";

/**
 * Predicado de empréstimo atrasado, escopo do leitor e ordem da lista.
 * Não lê o banco e não recalcula o prazo: a data já veio gravada.
 */
export function selecionarEmprestimosAtrasados(
  linhas: readonly LinhaEmprestimoAtrasado[],
  now: Date,
  escopo: EscopoLeituraEmprestimosAtrasados,
): EmprestimoAtrasado[] {
  if (escopo.tipo === "nenhum") return [];

  const atrasados: EmprestimoAtrasado[] = [];
  for (const linha of linhas) {
    const item = paraAtrasado(linha, now);
    if (!item) continue;
    if (escopo.tipo === "codRep" && item.codRep !== escopo.codRep) continue;
    atrasados.push(item);
  }
  atrasados.sort(compararEmprestimoAtrasado);
  return atrasados;
}

function paraAtrasado(linha: LinhaEmprestimoAtrasado, now: Date): EmprestimoAtrasado | null {
  const venceEm = linha.emprestimoVenceEm;
  if (venceEm == null || venceEm.getTime() >= now.getTime()) return null;
  if (linha.custodia !== "CLIENTE") return null;
  if (linha.motivoBaixa !== null) return null;
  if (linha.baixadoEm !== null) return null;
  if (linha.convertedToContainerId !== null) return null;
  if (linha.alocacaoEncerradaEm !== null) return null;

  return {
    id: linha.id,
    identificador: linha.identificador,
    cliente: linha.cliente,
    codCli: linha.codCli,
    numPed: linha.numPed,
    codCar: linha.codCar,
    codRep: linha.codRep,
    emprestimoVenceEm: venceEm,
  };
}

function compararEmprestimoAtrasado(a: EmprestimoAtrasado, b: EmprestimoAtrasado): number {
  const porPrazo = a.emprestimoVenceEm.getTime() - b.emprestimoVenceEm.getTime();
  if (porPrazo !== 0) return porPrazo;
  if (a.identificador < b.identificador) return -1;
  if (a.identificador > b.identificador) return 1;
  return 0;
}
