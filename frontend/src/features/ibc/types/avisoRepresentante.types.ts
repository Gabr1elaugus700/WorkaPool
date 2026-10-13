export type ModalidadeAvisoRepresentante = "VENDA" | "EMPRESTIMO";

export type ItemAvisoRepresentante = {
  identificador: string;
  modalidade: ModalidadeAvisoRepresentante;
  emprestimoVenceEm: string | null;
};

export type AvisoRepresentante = {
  id: string;
  codCar: number;
  numPed: string;
  codCli: string | null;
  cliente: string;
  codRep: number;
  itens: ItemAvisoRepresentante[];
  lidoEm: string | null;
  createdAt: string;
};

export type ListaAvisosRepresentante = {
  avisos: AvisoRepresentante[];
};
