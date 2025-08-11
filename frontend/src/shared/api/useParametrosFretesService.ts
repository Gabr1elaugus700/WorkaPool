import { ParametrosFrete } from '@/types/Parametros';
import { getBaseUrl } from '@/lib/apiBase';


export const fetchParametrosFrete = async (valor_diesel_s10_sem_icms: number, valor_diesel_s10_com_icms: number, valor_salario_motorista_dia: number, valor_refeicao_motorista_dia: number, valor_ajuda_custo_motorista: number, valor_chapa_descarga: number, valor_desgaste_pneus: number): Promise<ParametrosFrete[]> => {
    const response = await fetch(`${getBaseUrl()}/api/parametrosFretes`, {
        method: 'FETCH',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            valor_diesel_s10_sem_icms,
            valor_diesel_s10_com_icms,
            valor_salario_motorista_dia,
            valor_refeicao_motorista_dia,
            valor_ajuda_custo_motorista,
            valor_chapa_descarga,
            valor_desgaste_pneus
        })
    });

    if (!response.ok) {
        throw new Error('Erro Ao cadastrar Parametros - Service FrontEnd: ' + response.statusText);
    }

    const data = await response.json();
    return data;
};

export const updateParametrosFrete = async (valor_diesel_s10_sem_icms: number, valor_diesel_s10_com_icms: number, valor_salario_motorista_dia: number, valor_refeicao_motorista_dia: number, valor_ajuda_custo_motorista: number, valor_chapa_descarga: number, valor_desgaste_pneus: number): Promise<ParametrosFrete> => {
    const response = await fetch(`${getBaseUrl()}/api/parametrosFretes`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            valor_diesel_s10_sem_icms,
            valor_diesel_s10_com_icms,
            valor_salario_motorista_dia,
            valor_refeicao_motorista_dia,
            valor_ajuda_custo_motorista,
            valor_chapa_descarga,
            valor_desgaste_pneus
        })
    });

    if (!response.ok) {
        throw new Error('Erro ao atualizar parâmetros de frete - Service FrontEnd: ' + response.statusText);
    }

    const data = await response.json();
    return data;
};

export const getParametrosFrete = async (): Promise<ParametrosFrete> => {
    const response = await fetch(`${getBaseUrl()}/api/parametrosFretes`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error('Erro ao buscar parâmetros de frete - Service FrontEnd: ' + response.statusText);
    }

    const data = await response.json();
    return data;
}

