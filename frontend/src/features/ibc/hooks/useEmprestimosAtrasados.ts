import { useQuery } from "@tanstack/react-query";
import { emprestimoAtrasadoService } from "../services/emprestimoAtrasadoService";

export function useEmprestimosAtrasados() {
  return useQuery({
    queryKey: ["ibc", "emprestimos-atrasados"],
    queryFn: emprestimoAtrasadoService.listar,
  });
}
