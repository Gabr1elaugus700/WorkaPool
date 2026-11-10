import { toError } from "./toError";

const JA_E_PADRAO = "Este checklist já é padrão deste produto.";

export function mensagemPadraoChecklist(err: unknown): string {
  const message = toError(err).message;
  if (message.toLowerCase().includes("já é padrão")) return JA_E_PADRAO;
  return message;
}
