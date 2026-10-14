export type EmprestimoAtrasado = {
  id: string;
  identificador: string;
  cliente: string | null;
  codCli: string | null;
  numPed: string;
  codCar: number;
  codRep: number | null;
  emprestimoVenceEm: string;
};

export type ListaEmprestimosAtrasados = {
  itens: EmprestimoAtrasado[];
};
