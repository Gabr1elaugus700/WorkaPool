import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ibcProdutoConfigService, type SaveIbcProdutoConfigInput } from "../services/ibcProdutoConfigService";

const KEY = ["ibc", "produto-config"] as const;

export function useIbcProdutoConfig(enabled: boolean) {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: KEY, queryFn: ibcProdutoConfigService.list, enabled });
  const save = useMutation({
    mutationFn: (input: SaveIbcProdutoConfigInput) => ibcProdutoConfigService.save(input),
    onSuccess: async () => {
      toast.success("Placa gravada");
      await queryClient.invalidateQueries({ queryKey: KEY });
    },
  });
  return { query, save };
}
