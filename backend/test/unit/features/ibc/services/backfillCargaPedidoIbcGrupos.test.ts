import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  backfillCargaPedidoIbcGrupos,
  CargaPedidoIbcGruposBackfillPorts,
  FotoPedidoIbcBackfill,
  ItemPedidoSapiens,
} from "../../../../../src/features/ibc/services/backfillCargaPedidoIbcGrupos";

type FotoMutavel = {
  id: string;
  numPed: string;
  gruposCodigo: string[];
  viagemFechada: boolean;
};

function harness(fotos: FotoMutavel[]) {
  const saves: { id: string; gruposCodigo: string[] }[] = [];
  let consultasSapiens = 0;
  const itens: ItemPedidoSapiens[] = [
    { numPed: "1", codPro: "P1", codigoEmbalagem: 251001 },
    { numPed: "1", codPro: "P2", codigoEmbalagem: "251001" },
    { numPed: "1", codPro: "P3", codigoEmbalagem: 20 },
    { numPed: "1", codPro: "P4", codigoEmbalagem: null },
    { numPed: "9", codPro: "P9", codigoEmbalagem: 251001 },
  ];

  const ports: CargaPedidoIbcGruposBackfillPorts = {
    async listFotos(): Promise<FotoPedidoIbcBackfill[]> {
      return fotos.map((foto) => ({ ...foto, gruposCodigo: [...foto.gruposCodigo] }));
    },
    async saveGrupos(id: string, gruposCodigo: string[]): Promise<void> {
      saves.push({ id, gruposCodigo });
      const foto = fotos.find((item) => item.id === id);
      if (foto) foto.gruposCodigo = [...gruposCodigo];
    },
    async listItensByNumPed(numPeds: readonly string[]): Promise<ItemPedidoSapiens[]> {
      consultasSapiens += 1;
      const pedidos = new Set(numPeds);
      return itens.filter((item) => pedidos.has(item.numPed));
    },
    async listGruposByProduto(): Promise<ReadonlyMap<string, string>> {
      return new Map([
        ["P1", "SODA"],
        ["P2", "CLORO"],
        ["P3", "BOMBONA"],
        ["P4", "AVULSO"],
        ["P9", "SODA"],
      ]);
    },
  };

  return { ports, saves, consultas: () => consultasSapiens };
}

describe("backfillCargaPedidoIbcGrupos (#419)", () => {
  it("fills open trips from the 251001 lines only, and leaves closed trips empty", async () => {
    const fotos: FotoMutavel[] = [
      { id: "aberta", numPed: "1", gruposCodigo: [], viagemFechada: false },
      { id: "fechada", numPed: "9", gruposCodigo: [], viagemFechada: true },
      { id: "ja-preenchida", numPed: "1", gruposCodigo: ["JA"], viagemFechada: false },
    ];
    const { ports, saves } = harness(fotos);

    const result = await backfillCargaPedidoIbcGrupos(ports);

    assert.equal(result.atualizadas, 1);
    assert.deepEqual(saves, [{ id: "aberta", gruposCodigo: ["SODA", "CLORO"] }]);
    assert.deepEqual(fotos.find((foto) => foto.id === "fechada")?.gruposCodigo, []);
    assert.deepEqual(fotos.find((foto) => foto.id === "ja-preenchida")?.gruposCodigo, ["JA"]);
  });

  it("a second run does not query Sapiens again or write anything", async () => {
    const fotos: FotoMutavel[] = [
      { id: "aberta", numPed: "1", gruposCodigo: [], viagemFechada: false },
      { id: "fechada", numPed: "9", gruposCodigo: [], viagemFechada: true },
    ];
    const { ports, saves, consultas } = harness(fotos);

    await backfillCargaPedidoIbcGrupos(ports);
    const depois = fotos.map((foto) => ({ id: foto.id, gruposCodigo: [...foto.gruposCodigo] }));
    saves.length = 0;

    const segunda = await backfillCargaPedidoIbcGrupos(ports);

    assert.equal(segunda.atualizadas, 0);
    assert.equal(consultas(), 1);
    assert.deepEqual(saves, []);
    assert.deepEqual(
      fotos.map((foto) => ({ id: foto.id, gruposCodigo: foto.gruposCodigo })),
      depois,
    );
  });
});
