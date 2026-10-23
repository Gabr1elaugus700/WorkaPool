import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  QUERY_GET_PEDIDOS_BY_CARGA,
  QUERY_ITENS_PEDIDO_POR_NUMERO,
} from "../../../../../src/features/pedidos/queries/pedidosQueries";

describe("queries de grupo do pedido IBC (#419)", () => {
  it("QUERY_GET_PEDIDOS_BY_CARGA traz grp.codgrp", () => {
    assert.match(QUERY_GET_PEDIDOS_BY_CARGA, /grp\.codgrp\s+AS \[COD_GRP\]/);
    assert.match(QUERY_GET_PEDIDOS_BY_CARGA, /grp\.codgrp,/);
  });

  it("o backfill lê itens por numPed sem filtrar sitped", () => {
    const sql = QUERY_ITENS_PEDIDO_POR_NUMERO("@numPed0, @numPed1");
    assert.match(sql, /ipd\.codpro/);
    assert.match(sql, /der\.usu_codemb/);
    assert.match(sql, /ipd\.numped IN \(@numPed0, @numPed1\)/);
    assert.doesNotMatch(sql, /sitped/i);
  });
});