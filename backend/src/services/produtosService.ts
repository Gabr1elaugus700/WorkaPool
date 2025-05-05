import { produtos } from '../repositories/produtosRepository';

type Produto = {
    COD_GRUPO: string;
    PRODUTOS: string;
};

export const getProdutos = async () => {
    const produtosList: Produto[] = await produtos();

    const produtosMap = produtosList.map(produto => ({
        ...produto,
        PRODUTOS: produto.PRODUTOS.trim()
    }));

    return produtosMap;
};