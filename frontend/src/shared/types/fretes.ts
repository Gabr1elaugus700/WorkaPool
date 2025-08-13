export type RotaBase = {
    id?: string;
    origem: string;
    destino: string;
    distancia: number;
    diasViagem: number;
};

export type SolicitacaoFrete = {
    id: undefined | string;
    peso: number;
    origem: string;
    destino: string;
    status: string;
    solicitante_user: string;
    dias_viagem: number;
    km_total: number;
};

export type CaminhaoRotaVinculo = {
    id: undefined | string;
    rota_base_id: number;
    caminhao_id: number;
    pedagio_ida: number;
    pedagio_volta: number;
    custo_combustivel: number;
    custo_total: number;
    salario_motorista_rota: number;
    refeicao_motorista_rota: number;
    ajuda_custo_motorista_rota: number;
    chapa_descarga_rota: number;
    desgaste_pneus_rota: number;
    modelo: string;
    capacidade_kg: number;
};