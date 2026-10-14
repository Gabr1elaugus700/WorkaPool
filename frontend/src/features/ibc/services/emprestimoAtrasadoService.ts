import { apiFetchJson } from "@/lib/apiFetch";
import type { ListaEmprestimosAtrasados } from "../types/emprestimoAtrasado.types";

export const emprestimoAtrasadoService = {
  listar: (): Promise<ListaEmprestimosAtrasados> =>
    apiFetchJson<ListaEmprestimosAtrasados>("/api/ibc/emprestimos-atrasados"),
};
