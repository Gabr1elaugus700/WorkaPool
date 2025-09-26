export interface Vistoria {
  id: string;
  data_vistoria: string;
  departamento_id: string;
  responsavel_id: string;
  vistoria_dpto?: { id: string; name: string; created_at?: string; recebe_os?: boolean };
  responsavel?: { id: string; name: string };
  checklistVistoria: ChecklistVistoriaItem[];
}

export interface ChecklistVistoriaItem {
  id: string;
  vistoria_id: string;
  checklistModeloId: string;
  checklistItemId: string;
  checked: boolean;
  observacao: string;
  ordemServicoId?: string | null;
  checklistItem: {
    id: string;
    descricao: string;
  };
}