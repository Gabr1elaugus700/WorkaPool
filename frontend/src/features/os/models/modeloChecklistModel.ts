export interface ModeloChecklist {
  id: string;
  nome: string;
  descricao?: string;
  itens: { id: string }[];
}