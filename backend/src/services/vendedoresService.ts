import { vendedores } from '../repositories/vendedoresRepository';

type Vendedor = {
    COD_REP: number;
    NOME_REP: string;
    APE_REP: string;
};

export const getVendedores = async () => {
    const vendedorList: Vendedor[] = await vendedores();

    const vendedorMap = vendedorList.map(vendedor => ({
        ...vendedor,
        APE_REP: vendedor.APE_REP.trim()
    }));

    return vendedorMap;
};