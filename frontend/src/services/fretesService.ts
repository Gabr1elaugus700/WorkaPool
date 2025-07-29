import { getBaseUrl } from '@/lib/apiBase';
import { SolicitacaoFrete, RotaBase  } from '@/types/fretes';


export const rotaBase = async (origem: string, destino: string, distancia: number, diasViagem: number): Promise<RotaBase> => {
    const response = await fetch(`${getBaseUrl()}/api/fretes/rota-base`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
            origem, 
            destino, 
            distancia, 
            diasViagem 
        })
    });

    if (!response.ok) {
        throw new Error('Erro ao criar rota base');
    }

    const data = await response.json();
    return data;
};


export const solicitacaoRota = async (peso: number, origem: string, destino: string, status: string, solicitante_user: string): Promise<SolicitacaoFrete> => {
    
    const response = await fetch(`${getBaseUrl()}/api/fretes/solicitacao-rota`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            peso,
            origem,
            destino,
            status,
            solicitante_user
        })
    });

    if (!response.ok) {
        throw new Error('Erro ao solicitar rota');
    }

    const data = await response.json();
    return data;
}

export const getRotas = async (): Promise<SolicitacaoFrete[]> => {
    const response = await fetch(`${getBaseUrl()}/api/fretes/rotas`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        }
    });

    if (!response.ok) {
        throw new Error('Erro ao buscar rotas: ' + response.statusText);
    }

    const data = await response.json();
    return data;
};

export const getRotasSolicitadas = async (): Promise<SolicitacaoFrete[]> => {
    const response = await fetch(`${getBaseUrl()}/api/fretes/fretes-solicitados`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        }
    });

    if (!response.ok) {
        throw new Error('Erro ao buscar rotas solicitadas: ' + response.statusText);
    }

    const data = await response.json();
    return data;
};


export const associarCaminhaoRota = async (rota_base_id: number, caminhao_id: number, pedagio_ida: number, pedagio_volta: number) => {
    const response = await fetch(`${getBaseUrl()}/api/fretes/caminhao-rota`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            rota_base_id,
            caminhao_id,
            pedagio_ida,
            pedagio_volta
        })
    });

    if (!response.ok) {
        throw new Error('Erro ao associar caminhão com rota:  ' + response.statusText);
    }

    const data = await response.json();
    return data;
};

