import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  toCreateChecklistItemData,
  toUpdateChecklistItemData,
} from "../../../../../src/features/ibc/utils/ibcChecklistItemWrite";
import { IbcChecklistItemRecord } from "../../../../../src/features/ibc/types/IbcChecklist.types";
import { AppError } from "../../../../../src/utils/AppError";

const numerico: IbcChecklistItemRecord = {
  id: "item-1",
  descricao: "Tampa",
  tipo: "NUMERICO",
  critico: true,
  respostaEsperada: null,
  bloqueante: null,
  ativo: true,
};

const simNao: IbcChecklistItemRecord = {
  id: "item-2",
  descricao: "Lacre íntegro",
  tipo: "SIM_NAO",
  critico: false,
  respostaEsperada: "SIM",
  bloqueante: true,
  ativo: true,
};

describe("ibcChecklistItemWrite", () => {
  it("creates numeric item without sim/não fields", () => {
    const data = toCreateChecklistItemData({
      descricao: "Base",
      critico: false,
    });
    assert.deepEqual(data, {
      descricao: "Base",
      tipo: "NUMERICO",
      critico: false,
      respostaEsperada: null,
      bloqueante: null,
    });
  });

  it("rejects sim/não create without respostaEsperada and bloqueante", () => {
    assert.throws(
      () =>
        toCreateChecklistItemData({
          descricao: "Lacre",
          tipo: "SIM_NAO",
          bloqueante: true,
        }),
      (error: unknown) =>
        error instanceof AppError && error.code === "IBC_CHECKLIST_ITEM_INVALID_BODY",
    );
  });

  it("creates sim/não item", () => {
    const data = toCreateChecklistItemData({
      descricao: "Lacre",
      tipo: "SIM_NAO",
      respostaEsperada: "NAO",
      bloqueante: false,
    });
    assert.deepEqual(data, {
      descricao: "Lacre",
      tipo: "SIM_NAO",
      critico: false,
      respostaEsperada: "NAO",
      bloqueante: false,
    });
  });

  it("switches numeric to sim/não requiring new fields", () => {
    assert.throws(
      () =>
        toUpdateChecklistItemData(numerico, {
          tipo: "SIM_NAO",
        }),
      (error: unknown) =>
        error instanceof AppError && error.code === "IBC_CHECKLIST_ITEM_INVALID_BODY",
    );

    const data = toUpdateChecklistItemData(numerico, {
      tipo: "SIM_NAO",
      respostaEsperada: "SIM",
      bloqueante: true,
    });
    assert.equal(data.tipo, "SIM_NAO");
    assert.equal(data.critico, false);
    assert.equal(data.respostaEsperada, "SIM");
    assert.equal(data.bloqueante, true);
  });

  it("switches sim/não to numeric and clears sim/não fields", () => {
    const data = toUpdateChecklistItemData(simNao, { tipo: "NUMERICO" });
    assert.deepEqual(data, {
      descricao: simNao.descricao,
      ativo: true,
      tipo: "NUMERICO",
      critico: false,
      respostaEsperada: null,
      bloqueante: null,
    });
  });

  it("updates bloqueante on sim/não without changing tipo", () => {
    const data = toUpdateChecklistItemData(simNao, { bloqueante: false });
    assert.equal(data.bloqueante, false);
    assert.equal(data.respostaEsperada, "SIM");
  });
});