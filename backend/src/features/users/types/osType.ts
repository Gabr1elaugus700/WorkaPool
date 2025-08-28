export default interface OrdemServico {
    id: string;
    descricao: string;
    status: string;
    prioridade: string;
    data_criacao: Date;
    data_conclusao: Date | null;
    email_solicitante: string | null;
    id_solicitante: string | null;
    id_vistoria: string | null;
}
