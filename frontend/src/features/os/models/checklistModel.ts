import { Departamento } from "@/features/departamentos/models/departamentosModel";

export interface ChecklistModelo {
  id: string;
  nome: string;
  descricao?: string; // pode ser opcional se não vier sempre
  departamento_id: string;
  departamento: Departamento;
  itens: ChecklistItemModelo[];
}

export interface ChecklistItemModelo {
  id: string;
  checklistModeloId: string;
  checklistItemId: string;
  checklistItem: {
    id: string;
    descricao: string;
  };
}