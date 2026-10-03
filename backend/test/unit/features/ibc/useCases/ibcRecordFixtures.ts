import { formatIbcIdentifier } from "../../../../../src/features/ibc/services/formatIbcIdentifier";
import {
  CreateDerivedIbcData,
  IbcCadastroRecord,
  IbcProdutoRecord,
} from "../../../../../src/features/ibc/types/IbcCadastro.types";

export function buildIbcRecord(
  overrides: Partial<IbcCadastroRecord> = {},
): IbcCadastroRecord {
  return {
    id: "ibc-source-1",
    identificador: "HMSA00015",
    prefixo: "HMSA",
    sequencial: 15,
    tipoCadastro: "NOVO",
    aptidao: "INAPTO",
    motivoInaptidao: "AGUARDANDO_INSPECAO",
    custodia: "PATIO",
    dataLimite: new Date("2099-12-31T00:00:00.000Z"),
    baixadoEm: null,
    createdAt: new Date("2026-09-16T10:00:00.000Z"),
    produtoId: "produto-a",
    convertedToContainerId: null,
    ...overrides,
  };
}

export function buildDerivedRecord(
  data: CreateDerivedIbcData,
  sequencial: number,
): IbcCadastroRecord {
  return buildIbcRecord({
    id: "ibc-target-1",
    identificador: formatIbcIdentifier(data.prefixo, sequencial),
    prefixo: data.prefixo,
    sequencial,
    produtoId: data.produtoId,
  });
}

export function buildProdutoRecord(
  overrides: Partial<IbcProdutoRecord> = {},
): IbcProdutoRecord {
  return {
    id: "produto-b",
    nome: "Soda",
    abreviacao: "SO",
    createdAt: new Date("2026-09-16T09:00:00.000Z"),
    updatedAt: new Date("2026-09-16T09:00:00.000Z"),
    ...overrides,
  };
}
