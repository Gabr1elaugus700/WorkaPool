import { getBaseUrl } from '@/lib/apiBase';
import { SolicitacaoFrete, RotaBase, CaminhaoRotaVinculo } from '@/types/fretes';


export const rotaBase = async (origem: string, destino: string, distancia: number, diasViagem: number): Promise<RotaBase> => {
    const response = await fetch(`${getBaseUrl()}/api/fretes/rota-base`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            origem,
            destino,
            total_km: distancia,
            dias_viagem: diasViagem
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

export const atualizarSolicitacaoRota = async (id: number): Promise<number> => {
    console.log("Atualizando solicitação de rota com ID:", id);
    
    const response = await fetch(`${getBaseUrl()}/api/fretes/solicitacao-rota/${id}`, {
        method: 'PUT',
        headers: {
            "Content-Type": "application/json",
        }
    });

    if (!response.ok) {
        throw new Error('Erro ao atualizar solicitação de rota: ' + response.statusText);
    }

    const data = await response.json();
    return data;
};

export const associarCaminhaoRota = async (rota_base_id: number,
    caminhao_id: number,
    pedagio_ida: number,
    pedagio_volta: number,
    custo_combustivel: number,
    custo_total: number,
    salario_motorista_rota: number,
    refeicao_motorista_rota: number,
    ajuda_custo_motorista_rota: number,
    chapa_descarga_rota: number,
    desgaste_pneus_rota: number,) => {
    console.log("Dados Recebidos pelo Service:", {
        rota_base_id,
        caminhao_id,
        pedagio_ida,
        pedagio_volta,
        custo_combustivel,
        custo_total,
        salario_motorista_rota,
        refeicao_motorista_rota,
        ajuda_custo_motorista_rota,
        chapa_descarga_rota,
        desgaste_pneus_rota,
    });
    const response = await fetch(`${getBaseUrl()}/api/fretes/caminhao-rota`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            rota_base_id,
            caminhao_id,
            pedagio_ida,
            pedagio_volta,
            custo_combustivel,
            custo_total,
            salario_motorista_rota,
            refeicao_motorista_rota,
            ajuda_custo_motorista_rota,
            chapa_descarga_rota,
            desgaste_pneus_rota,
        })
    });

    if (!response.ok) {
        throw new Error('Erro ao associar caminhão com rota:  ' + response.statusText);
    }

    const data = await response.json();
    return data;
};

export const getCaminhaoRota = async (rotaId: number) => {
    const response = await fetch(`${getBaseUrl()}/api/fretes/caminhaoRota/${rotaId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        }
    });

    if (!response.ok) {
        throw new Error('Erro ao buscar caminhão associado à rota: ' + response.statusText);
    }

    const data = await response.json();
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object') return Object.values(data);
    return [];
};

export const atualizarCaminhaoRota = async (rotaId: number, caminhaoId: number, dadosAtualizados: Partial<CaminhaoRotaVinculo>) => {
    const response = await fetch(`${getBaseUrl()}/api/fretes/caminhaoRota/${rotaId}/${caminhaoId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(dadosAtualizados)
    });

    if (!response.ok) {
        throw new Error('Erro ao atualizar caminhão associado à rota: ' + response.statusText);
    }

    const data = await response.json();
    return data;
};
