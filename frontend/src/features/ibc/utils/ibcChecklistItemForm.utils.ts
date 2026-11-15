import type {
  CreateIbcChecklistItemInput,
  IbcChecklistItemDTO,
  IbcChecklistItemRespostaEsperada,
  IbcChecklistItemTipo,
  UpdateIbcChecklistItemInput,
} from "../types/ibcChecklist.types";

export type IbcChecklistItemFormState = {
  descricao: string;
  tipo: IbcChecklistItemTipo;
  critico: boolean;
  respostaEsperada?: IbcChecklistItemRespostaEsperada;
  bloqueante?: boolean;
};

export function initialItemFormState(editing: IbcChecklistItemDTO | null): IbcChecklistItemFormState {
  if (!editing) {
    return {
      descricao: "",
      tipo: "NUMERICO",
      critico: false,
      respostaEsperada: undefined,
      bloqueante: undefined,
    };
  }

  if (editing.tipo === "SIM_NAO") {
    return {
      descricao: editing.descricao,
      tipo: "SIM_NAO",
      critico: false,
      respostaEsperada: editing.respostaEsperada ?? undefined,
      bloqueante: editing.bloqueante ?? undefined,
    };
  }

  return {
    descricao: editing.descricao,
    tipo: "NUMERICO",
    critico: editing.critico,
    respostaEsperada: undefined,
    bloqueante: undefined,
  };
}

export function applyItemFormTipoChange(
  state: IbcChecklistItemFormState,
  nextTipo: IbcChecklistItemTipo,
): IbcChecklistItemFormState {
  if (nextTipo === state.tipo) return state;

  if (nextTipo === "NUMERICO") {
    return {
      ...state,
      tipo: "NUMERICO",
      critico: false,
      respostaEsperada: undefined,
      bloqueante: undefined,
    };
  }

  return {
    ...state,
    tipo: "SIM_NAO",
    critico: false,
    respostaEsperada: undefined,
    bloqueante: undefined,
  };
}

export function canSubmitItemForm(state: IbcChecklistItemFormState): boolean {
  if (state.descricao.trim().length === 0) return false;
  if (state.tipo === "SIM_NAO") {
    return state.respostaEsperada !== undefined && state.bloqueante !== undefined;
  }
  return true;
}

type BuildPayloadOptions = {
  isEdit: boolean;
  originalTipo?: IbcChecklistItemTipo;
};

export function buildItemPayload(
  state: IbcChecklistItemFormState,
  options: BuildPayloadOptions,
): CreateIbcChecklistItemInput | UpdateIbcChecklistItemInput {
  const descricao = state.descricao.trim();

  if (state.tipo === "NUMERICO") {
    const payload: CreateIbcChecklistItemInput = { descricao, critico: state.critico };
    if (options.isEdit && options.originalTipo === "SIM_NAO") {
      return { ...payload, tipo: "NUMERICO" };
    }
    if (!options.isEdit) return payload;
    return payload;
  }

  const simNaoPayload = {
    descricao,
    tipo: "SIM_NAO" as const,
    respostaEsperada: state.respostaEsperada,
    bloqueante: state.bloqueante,
  };

  if (options.isEdit && options.originalTipo === "NUMERICO") {
    return simNaoPayload;
  }
  if (!options.isEdit) return simNaoPayload;

  return simNaoPayload;
}

export function resetItemFormAfterSuccess(): IbcChecklistItemFormState {
  return initialItemFormState(null);
}