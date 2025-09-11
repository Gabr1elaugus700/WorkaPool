export interface ChecklistModelo {
  id: string;
  nome: string;
  descricao: string;
  itens: ChecklistItemModelo[];
}

export interface ChecklistItemModelo {
  id: string;
  descricao: string;
  checked: boolean;
}

