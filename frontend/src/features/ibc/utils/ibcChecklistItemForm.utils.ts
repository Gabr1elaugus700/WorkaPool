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

const emptySimNao = { respostaEsperada: undefined, bloqueante: undefined } as const;

export function initialItemFormState(editing: IbcChecklistItemDTO | null): IbcChecklistItemFormState {
  if (!editing) {
    return { descricao: "", tipo: "NUMERICO", critico: false, ...emptySimNao };
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
  return { descricao: editing.descricao, tipo: "NUMERICO", critico: editing.critico, ...emptySimNao };
}

export function applyItemFormTipoChange(
  state: IbcChecklistItemFormState,
  nextTipo: IbcChecklistItemTipo,
): IbcChecklistItemFormState {
  if (nextTipo === state.tipo) return state;
  return nextTipo === "NUMERICO"
    ? { ...state, tipo: "NUMERICO", critico: false, ...emptySimNao }
    : { ...state, tipo: "SIM_NAO", critico: false, ...emptySimNao };
}

export function canSubmitItemForm(state: IbcChecklistItemFormState): boolean {
  if (!state.descricao.trim()) return false;
  return state.tipo !== "SIM_NAO" || (state.respostaEsperada !== undefined && state.bloqueante !== undefined);
}

type BuildPayloadOptions = { isEdit: boolean; originalTipo?: IbcChecklistItemTipo };

export function buildItemPayload(
  state: IbcChecklistItemFormState,
  options: BuildPayloadOptions,
): CreateIbcChecklistItemInput | UpdateIbcChecklistItemInput {
  const descricao = state.descricao.trim();
  if (state.tipo === "NUMERICO") {
    const payload = { descricao, critico: state.critico };
    return options.isEdit && options.originalTipo === "SIM_NAO" ? { ...payload, tipo: "NUMERICO" } : payload;
  }
  return {
    descricao,
    tipo: "SIM_NAO",
    respostaEsperada: state.respostaEsperada,
    bloqueante: state.bloqueante,
  };
}

export function resetItemFormAfterSuccess(): IbcChecklistItemFormState {
  return initialItemFormState(null);
}