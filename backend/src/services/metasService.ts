// src/services/MetasService.ts
import { MetasRepository } from "../repositories/metasRepository";

type MetaPayload = {
  codRep: number;
  mesMeta: number;
  anoMeta: number;
  metas: {
    produto: string;
    metaProduto: number;
    precoMedio?: number; // Optional, can be added later if needed
    totalVendas?: number; // Optional, can be added later if needed
  }[];
};

export const MetasService = {
  async salvar(payload: MetaPayload) {
    const { codRep, mesMeta, anoMeta, metas } = payload;

    await MetasRepository.apagarMetasAntigas(codRep, mesMeta, anoMeta);

    const metasFormatadas = metas.map((m) => ({
      codRep,
      mesMeta,
      anoMeta,
      produto: m.produto,
      metaProduto: m.metaProduto,
      precoMedio: m.precoMedio,
      totalVendas: m.totalVendas,
    }));

    return MetasRepository.salvarMetasEmLote(metasFormatadas);
  },
};
