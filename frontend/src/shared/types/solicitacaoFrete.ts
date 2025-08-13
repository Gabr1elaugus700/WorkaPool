export type SolicitacaoFrete = {
    id?: string;
    origem: string;
    destino: string;
    peso: number;
    status: string;
    solicitante_user: string;
    km_total?: number;
    dias_viagem?: number;
    rotaBaseId?: number;
};
