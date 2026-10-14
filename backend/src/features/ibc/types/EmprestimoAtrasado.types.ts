/** Quem a permissão deixou ler. A seleção não relê o papel. */
export type EscopoLeituraEmprestimosAtrasados =
  | { tipo: "todas" }
  | { tipo: "codRep"; codRep: number }
  | { tipo: "nenhum" };

export type CustodiaLinhaEmprestimo = "PATIO" | "EM_VIAGEM" | "ENTRADA" | "CLIENTE";

export type MotivoBaixaLinhaEmprestimo = "VENDA" | "TROCA";

/**
 * Projeção lida do pool. Ainda pode falhar o predicado: a função pura
 * descarta quem não está atrasado.
 */
export type LinhaEmprestimoAtrasado = {
  id: string;
  identificador: string;
  cliente: string | null;
  codCli: string | null;
  numPed: string;
  codCar: number;
  codRep: number | null;
  emprestimoVenceEm: Date | null;
  custodia: CustodiaLinhaEmprestimo;
  motivoBaixa: MotivoBaixaLinhaEmprestimo | null;
  baixadoEm: Date | null;
  convertedToContainerId: string | null;
  alocacaoEncerradaEm: Date | null;
};

/** Empréstimo que entrou na lista. O prazo gravado já venceu. */
export type EmprestimoAtrasado = {
  id: string;
  identificador: string;
  cliente: string | null;
  codCli: string | null;
  numPed: string;
  codCar: number;
  codRep: number | null;
  emprestimoVenceEm: Date;
};
