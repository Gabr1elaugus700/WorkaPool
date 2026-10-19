import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { avisoRepresentanteService } from "../services/avisoRepresentanteService";
import { toError } from "../utils/toError";

const AVISOS_REPRESENTANTE_QUERY_KEY = ["ibc", "avisos-representante"] as const;

export function useAvisosRepresentante(enabled = true) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: AVISOS_REPRESENTANTE_QUERY_KEY,
    queryFn: avisoRepresentanteService.listar,
    enabled,
  });
  const marcarLido = useMutation({
    mutationFn: avisoRepresentanteService.marcarLido,
    onSuccess: async () => {
      toast.success("Aviso marcado como lido");
      await queryClient.invalidateQueries({ queryKey: AVISOS_REPRESENTANTE_QUERY_KEY });
    },
    onError: (err) => {
      toast.error(toError(err).message || "Falha ao marcar o aviso como lido");
    },
  });

  return { marcarLido, ...query };
}
