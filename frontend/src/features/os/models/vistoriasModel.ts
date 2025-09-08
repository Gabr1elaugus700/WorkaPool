export interface Vistoria {
  id: string;
  departamento_id: string;
  responsavel_id: string;
  data_vistoria: string;
  responsavel?: { id: string; name: string };
  vistoria_dpto?: { id: string; name: string };
}

