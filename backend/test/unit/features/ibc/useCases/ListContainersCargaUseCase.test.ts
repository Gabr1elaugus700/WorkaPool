import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { IIbcExpedicaoRepository } from "../../../../../src/features/ibc/repositories/IIbcExpedicaoRepository";
import { GruposConfiguradosLookup } from "../../../../../src/features/ibc/services/carregarCompatibilidadeDePedidos";
import {
  IbcCandidatoPaleta,
  IbcVinculadoPaleta,
  PlacaGrupoPaleta,
} from "../../../../../src/features/ibc/types/IbcExpedicao.types";
import {
  ListContainersCargaUseCase,
  PlacasGrupoLookup,
} from "../../../../../src/features/ibc/useCases/ListContainersCarga.use-case";
import {
  CargaExpedicaoRef,
  CargaPedidoIbcSnapshot,
} from "../../../../../src/features/ibc/types/IbcExpedicao.types";

const CARGA_ID = "carga-1";
const COD_CAR = 101;
const AGORA = new Date("2026-11-11T12:00:00.000Z");

const carga = (): CargaExpedicaoRef => ({
  id: CARGA_ID,
  codCar: COD_CAR,
  destino: "Blumenau",
  situacao: "FECHADA",
  previsaoSaida: new Date("2026-11-12T10:00:00.000Z"),
});

const pedido = (): CargaPedidoIbcSnapshot => ({
  numPed: "1120",
  codCli: "C1",
  cliente: "Cliente",
  quantidadeEsperadaTotal: 2,
  quantidadeEsperadaVenda: 2,
  quantidadeEsperadaEmprestimo: 0,
  ibcInvalido: false,
  posCar: 1,
  gruposCodigo: ["G1"],
});

const candidato = (
  overrides: Partial<IbcCandidatoPaleta> = {},
): IbcCandidatoPaleta => ({
  identificador: "HMAB0001",
  prefixo: "HMAB",
  universal: false,
  grupoCodigo: "G1",
  corHex: "#112233",
  aptidao: "APTO",
  custodia: "PATIO",
  dataLimite: new Date("2099-01-01T00:00:00.000Z"),
  baixadoEm: null,
  convertedToContainerId: null,
  ...overrides,
});

const vinculado = (
  overrides: Partial<IbcVinculadoPaleta> = {},
): IbcVinculadoPaleta => ({
  alocacaoId: "aloc-1",
  identificador: "HMAB0009",
  prefixo: "HMAB",
  universal: false,
  grupoCodigo: "G1",
  corHex: "#112233",
  ...overrides,
});

function executar(input: {
  vinculados?: IbcVinculadoPaleta[];
  candidatos?: IbcCandidatoPaleta[];
  configurados?: string[];
  placas?: PlacaGrupoPaleta[];
}) {
  const repo = {
    getCargaByCodCar: async () => carga(),
    listPedidosIbcByCargaId: async () => [pedido()],
    listVinculadosPaleta: async () => input.vinculados ?? [],
    listCandidatosPaleta: async () => input.candidatos ?? [],
  } as unknown as IIbcExpedicaoRepository;
  const grupos: GruposConfiguradosLookup = {
    listGruposConfigurados: async () => input.configurados ?? ["G1"],
  };
  const placas: PlacasGrupoLookup = {
    listPlacasGrupos: async () => input.placas ?? [{
      grupoCodigo: "G1",
      sigla: "AB",
      corHex: "#112233",
    }],
  };
  return new ListContainersCargaUseCase(repo, grupos, placas, () => AGORA).execute({
    codCar: COD_CAR,
  });
}

describe("ListContainersCargaUseCase", () => {
  it("devolve vinculado, compatível de grupo, universal e o cabeçalho do grupo", async () => {
    const paleta = await executar({
      vinculados: [vinculado()],
      candidatos: [
        candidato({ identificador: "HMAB0001", prefixo: "HMAB", grupoCodigo: "G1", universal: false }),
        candidato({
          identificador: "NH0002",
          prefixo: "NH",
          grupoCodigo: null,
          universal: true,
          corHex: "#AABBCC",
        }),
      ],
    });

    assert.deepEqual(paleta.grupos, [{ grupoCodigo: "G1", sigla: "AB", corHex: "#112233" }]);
    assert.deepEqual(paleta.vinculados, [{
      identificador: "HMAB0009",
      alocacaoId: "aloc-1",
      grupoCodigo: "G1",
      corHex: "#112233",
      universal: false,
      homologado: true,
    }]);
    assert.deepEqual(
      paleta.disponiveis.map((item) => item.identificador),
      ["HMAB0001", "NH0002"],
    );
    assert.equal(paleta.disponiveis[0]?.alocacaoId, null);
    assert.equal(paleta.disponiveis[0]?.homologado, true);
    assert.equal(paleta.disponiveis[1]?.universal, true);
    assert.equal(paleta.disponiveis[1]?.homologado, false);
    assert.equal(paleta.disponiveis[1]?.grupoCodigo, null);
  });

  it("exclui legado HM####, grupo incompatível, inapto, data limite, custódia, baixa e substituição", async () => {
    const paleta = await executar({
      candidatos: [
        candidato({ identificador: "HM0045", prefixo: "HM", grupoCodigo: null, universal: false }),
        candidato({ identificador: "HMZZ0001", prefixo: "HMZZ", grupoCodigo: "OUTRO" }),
        candidato({ identificador: "HMAB0002", prefixo: "HMAB", aptidao: "INAPTO" }),
        candidato({
          identificador: "HMAB0003",
          prefixo: "HMAB",
          dataLimite: new Date("2020-01-01T00:00:00.000Z"),
        }),
        candidato({ identificador: "HMAB0004", prefixo: "HMAB", custodia: "EM_VIAGEM" }),
        candidato({ identificador: "HMAB0005", prefixo: "HMAB", custodia: "ENTRADA" }),
        candidato({ identificador: "HMAB0006", prefixo: "HMAB", custodia: "CLIENTE" }),
        candidato({
          identificador: "HMAB0007",
          prefixo: "HMAB",
          baixadoEm: new Date("2026-01-01T00:00:00.000Z"),
        }),
        candidato({
          identificador: "HMAB0008",
          prefixo: "HMAB",
          convertedToContainerId: "novo",
        }),
      ],
    });

    assert.deepEqual(paleta.disponiveis, []);
  });
});
