import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { IIbcExpedicaoRepository } from "../../../../../src/features/ibc/repositories/IIbcExpedicaoRepository";
import { PlacasDaCargaLookup, ListContainersCargaUseCase } from "../../../../../src/features/ibc/useCases/ListContainersCarga.use-case";
import {
  CargaExpedicaoRef,
  CargaPedidoIbcSnapshot,
  IbcPaletaFonte,
} from "../../../../../src/features/ibc/types/IbcExpedicao.types";

const CARGA_ID = "carga-1";
const AGORA = new Date("2026-11-12T12:00:00.000Z");

function carga(): CargaExpedicaoRef {
  return {
    id: CARGA_ID,
    codCar: 383,
    destino: "Teste",
    situacao: "FECHADA",
    previsaoSaida: AGORA,
  };
}

function pedido(): CargaPedidoIbcSnapshot {
  return {
    numPed: "10",
    codCli: "C1",
    cliente: "Cliente",
    quantidadeEsperadaTotal: 2,
    quantidadeEsperadaVenda: 2,
    quantidadeEsperadaEmprestimo: 0,
    ibcInvalido: false,
    posCar: null,
    gruposCodigo: ["CLORO"],
  };
}

function ibc(parcial: Partial<IbcPaletaFonte> & Pick<IbcPaletaFonte, "identificador">): IbcPaletaFonte {
  return {
    id: parcial.identificador,
    aptidao: "APTO",
    custodia: "PATIO",
    dataLimite: new Date("2099-01-01T00:00:00.000Z"),
    convertedToContainerId: null,
    universal: false,
    grupoCodigo: "CLORO",
    corHex: "#00AA00",
    homologado: true,
    alocacaoAberta: null,
    ...parcial,
  };
}

function placas(): PlacasDaCargaLookup {
  return {
    async listGruposConfigurados(grupos) {
      return grupos.filter((grupo) => grupo === "CLORO");
    },
    async listPlacas() {
      return [{ grupoCodigo: "CLORO", sigla: "CL", corHex: "#00AA00" }];
    },
    async listDescricoes() {
      return [{ grupoCodigo: "CLORO", grupoDescricao: "Hipoclorito" }];
    },
  };
}

function repo(fontes: IbcPaletaFonte[]): Pick<
  IIbcExpedicaoRepository,
  "getCargaByCodCar" | "listPedidosIbcByCargaId" | "listIbcsParaPaleta"
> {
  return {
    async getCargaByCodCar() {
      return carga();
    },
    async listPedidosIbcByCargaId() {
      return [pedido()];
    },
    async listIbcsParaPaleta() {
      return fontes;
    },
  };
}

describe("ListContainersCargaUseCase", () => {
  it("separa vinculados e disponíveis compatíveis e devolve a placa do grupo", async () => {
    const resultado = await new ListContainersCargaUseCase(
      repo([
        ibc({ identificador: "HMCL1" }),
        ibc({
          identificador: "HMCL2",
          alocacaoAberta: { id: "aloc-1", cargaId: CARGA_ID },
        }),
        ibc({ identificador: "NHCL1", homologado: false }),
        ibc({ identificador: "NH1", universal: true, grupoCodigo: null, corHex: null, homologado: false }),
      ]),
      placas(),
      AGORA,
    ).execute(383);

    assert.deepEqual(resultado.grupos, [{
      grupoCodigo: "CLORO",
      sigla: "CL",
      corHex: "#00AA00",
      grupoDescricao: "Hipoclorito",
    }]);
    assert.deepEqual(resultado.vinculados.map((item) => item.identificador), ["HMCL2"]);
    assert.equal(resultado.vinculados[0]?.alocacaoId, "aloc-1");
    assert.deepEqual(resultado.disponiveis.map((item) => item.identificador), ["HMCL1", "NHCL1", "NH1"]);
  });

  it("deixa de fora inapto, outra custódia, substituído, alocado, legado e grupo incompatível", async () => {
    const resultado = await new ListContainersCargaUseCase(
      repo([
        ibc({ identificador: "INAPTO", aptidao: "INAPTO" }),
        ibc({ identificador: "VIAGEM", custodia: "EM_VIAGEM" }),
        ibc({ identificador: "ENTRADA", custodia: "ENTRADA" }),
        ibc({ identificador: "CLIENTE", custodia: "CLIENTE" }),
        ibc({ identificador: "TROCADO", convertedToContainerId: "novo" }),
        ibc({ identificador: "OUTRA", alocacaoAberta: { id: "aloc-x", cargaId: "outra" } }),
        ibc({ identificador: "HM0001", grupoCodigo: null, universal: false, corHex: null }),
        ibc({ identificador: "HMSD1", grupoCodigo: "SODA" }),
        ibc({ identificador: "VENCIDO", dataLimite: new Date("2020-01-01T00:00:00.000Z") }),
      ]),
      placas(),
      AGORA,
    ).execute(383);

    assert.deepEqual(resultado.disponiveis, []);
    assert.deepEqual(resultado.vinculados, []);
  });

  it("omite o nome quando o catálogo não tem descrição", async () => {
    const emBranco = placas();
    const lookup: PlacasDaCargaLookup = {
      listGruposConfigurados: (grupos) => emBranco.listGruposConfigurados(grupos),
      listPlacas: (grupos) => emBranco.listPlacas(grupos),
      async listDescricoes() {
        return [{ grupoCodigo: "CLORO", grupoDescricao: "   " }];
      },
    };
    const comEspaco = await new ListContainersCargaUseCase(
      repo([ibc({ identificador: "HMCL1" })]),
      lookup,
      AGORA,
    ).execute(383);
    assert.equal(comEspaco.grupos[0]?.grupoDescricao, null);

    const ausente = await new ListContainersCargaUseCase(
      repo([ibc({ identificador: "HMCL1" })]),
      {
        listGruposConfigurados: (grupos) => emBranco.listGruposConfigurados(grupos),
        listPlacas: (grupos) => emBranco.listPlacas(grupos),
        async listDescricoes() {
          return [];
        },
      },
      AGORA,
    ).execute(383);
    assert.equal(ausente.grupos[0]?.grupoDescricao, null);
  });
});
