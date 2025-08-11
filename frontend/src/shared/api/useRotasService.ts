import { Caminhao } from '@/types/caminhoes';
import { getBaseUrl } from '@/lib/apiBase';


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
