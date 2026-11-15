import { AppError } from "../../../utils/AppError";
import { IbcChecklistItemRecord } from "../types/IbcChecklist.types";

export function checklistTemItemNumerico(
  itens: Pick<IbcChecklistItemRecord, "tipo">[],
): boolean {
  return itens.some((item) => item.tipo === "NUMERICO");
}

export type ResolveIbcChecklistMinimasInput = {
  itens: Pick<IbcChecklistItemRecord, "tipo">[];
  incoming: {
    notaMinimaCritico?: number | null;
    mediaMinima?: number | null;
  };
  existing?: {
    notaMinimaCritico: number | null;
    mediaMinima: number | null;
  } | null;
};

export function invalidChecklistMinimasBody(): AppError {
  return new AppError({
    message: "Corpo do checklist inválido",
    statusCode: 400,
    code: "IBC_CHECKLIST_INVALID_BODY",
  });
}

export function resolveIbcChecklistMinimas(
  input: ResolveIbcChecklistMinimasInput,
): { notaMinimaCritico: number | null; mediaMinima: number | null } {
  if (!checklistTemItemNumerico(input.itens)) {
    return { notaMinimaCritico: null, mediaMinima: null };
  }

  const resolveOne = (
    key: "notaMinimaCritico" | "mediaMinima",
  ): number | null => {
    const fromIncoming = input.incoming[key];
    if (fromIncoming !== undefined) {
      return fromIncoming;
    }
    if (input.existing) {
      return input.existing[key];
    }
    return null;
  };

  const notaMinimaCritico = resolveOne("notaMinimaCritico");
  const mediaMinima = resolveOne("mediaMinima");

  if (notaMinimaCritico === null || mediaMinima === null) {
    throw invalidChecklistMinimasBody();
  }

  return { notaMinimaCritico, mediaMinima };
}