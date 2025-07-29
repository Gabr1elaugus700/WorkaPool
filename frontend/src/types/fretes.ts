export type RotaBase = {
    origem: string;
    destino: string;
    distancia: number;
    diasViagem: number;
};

export type SolicitacaoFrete = {
    peso: number;
    origem: string;
    destino: string;
    status: string;
    solicitante_user: string;
};

