import { AppError } from "../../../utils/AppError";
import {
  CreateIbcChecklistItemData,
  UpdateIbcChecklistItemData,
} from "../repositories/IIbcChecklistItemRepository";
import {
  ChecklistItemRespostaEsperada,
  ChecklistItemTipo,
  IbcChecklistItemRecord,
} from "../types/IbcChecklist.types";

export type CreateItemHttpInput = {
  tipo?: ChecklistItemTipo;
  descricao: string;
  critico?: boolean;
  respostaEsperada?: ChecklistItemRespostaEsperada;
  bloqueante?: boolean;
};

export type UpdateItemHttpInput = {
  descricao?: string;
  ativo?: boolean;
  tipo?: ChecklistItemTipo;
  critico?: boolean;
  respostaEsperada?: ChecklistItemRespostaEsperada;
  bloqueante?: boolean;
};

function invalidItemBody(message: string): AppError {
  return new AppError({
    message,
    statusCode: 400,
    code: "IBC_CHECKLIST_ITEM_INVALID_BODY",
  });
}

export function toCreateChecklistItemData(input: CreateItemHttpInput): CreateIbcChecklistItemData {
  const tipo = input.tipo ?? "NUMERICO";
  if (tipo === "NUMERICO") {
    if (input.respostaEsperada !== undefined || input.bloqueante !== undefined) {
      throw invalidItemBody(
        "Item numérico não aceita resposta esperada nem bloqueante",
      );
    }
    return {
      descricao: input.descricao.trim(),
      tipo,
      critico: input.critico ?? false,
      respostaEsperada: null,
      bloqueante: null,
    };
  }

  if (input.respostaEsperada === undefined || input.bloqueante === undefined) {
    throw invalidItemBody(
      "Item sim/não exige resposta esperada e bloqueante",
    );
  }
  if (input.critico !== undefined) {
    throw invalidItemBody("Item sim/não não usa crítico");
  }

  return {
    descricao: input.descricao.trim(),
    tipo,
    critico: false,
    respostaEsperada: input.respostaEsperada,
    bloqueante: input.bloqueante,
  };
}

export function toUpdateChecklistItemData(
  existing: IbcChecklistItemRecord,
  input: UpdateItemHttpInput,
): UpdateIbcChecklistItemData {
  const tipo = input.tipo ?? existing.tipo;
  const tipoChanged = input.tipo !== undefined && input.tipo !== existing.tipo;

  const descricao = input.descricao?.trim() ?? existing.descricao;
  const ativo = input.ativo ?? existing.ativo;

  if (tipo === "NUMERICO") {
    if (input.respostaEsperada !== undefined || input.bloqueante !== undefined) {
      throw invalidItemBody(
        "Item numérico não aceita resposta esperada nem bloqueante",
      );
    }
    const critico =
      input.critico ?? (tipoChanged ? false : existing.critico);
    return {
      descricao,
      ativo,
      tipo,
      critico,
      respostaEsperada: null,
      bloqueante: null,
    };
  }

  if (input.critico !== undefined) {
    throw invalidItemBody("Item sim/não não usa crítico");
  }

  const respostaEsperada =
    input.respostaEsperada ??
    (tipoChanged ? undefined : existing.respostaEsperada);
  const bloqueante =
    input.bloqueante ?? (tipoChanged ? undefined : existing.bloqueante);

  if (respostaEsperada === null || respostaEsperada === undefined) {
    throw invalidItemBody(
      "Item sim/não exige resposta esperada e bloqueante",
    );
  }
  if (bloqueante === null || bloqueante === undefined) {
    throw invalidItemBody(
      "Item sim/não exige resposta esperada e bloqueante",
    );
  }

  return {
    descricao,
    ativo,
    tipo,
    critico: false,
    respostaEsperada,
    bloqueante,
  };
}