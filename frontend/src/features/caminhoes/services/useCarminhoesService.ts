import { Caminhao } from '@/shared/types/caminhoes';
import { getBaseUrl } from '@/shared/services/apiBase';


export const fetchCaminhoes = async (modelo: string, eixos: number, eixos_carregado: number, eixos_vazio: number, pneus: number, capacidade_kg: number, consumo_medio_km_l: number): Promise<Caminhao[]> => {
    const response = await fetch(`${getBaseUrl()}/api/caminhoes`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            modelo,
            eixos,
            eixos_carregado,
            eixos_vazio,
            pneus,
            capacidade_kg,
            consumo_medio_km_l
        })
    });

    if (!response.ok) {
        throw new Error('Erro Ao cadastrar Caminhão');
    }

    const data = await response.json();
    return data;
};

export const getCaminhoes = async (): Promise<Caminhao[]> => {
    const response = await fetch(`${getBaseUrl()}/api/caminhoes`, {
        method: 'GET',
    });

    if (!response.ok) {
        throw new Error('Erro ao obter caminhões');
    }

    const data = await response.json();
    return data;
};
