import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ibcChecklistService } from "../services/ibcChecklistService";
import { ibcInspecaoService } from "../services/ibcInspecaoService";
import type { RegistrarIbcInspecaoInput } from "../types/ibcInspecao.types";
import { formatNotaInspecao } from "../utils/ibcInspecao.utils";
import { toError } from "../utils/toError";
import { IBC_CHECKLISTS_KEY } from "./useIbcChecklists";

export function useIbcInspecaoChecklist(checklistId: string | null) {
  return useQuery({
    queryKey: [...IBC_CHECKLISTS_KEY, checklistId],
    queryFn: () => ibcChecklistService.getChecklist(checklistId ?? ""),
    enabled: checklistId != null,
  });
}

export function useIbcInspecao() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ ibcId, input }: { ibcId: string; input: RegistrarIbcInspecaoInput }) =>
      ibcInspecaoService.registrar(ibcId, input),
    onSuccess: async ({ inspecao, aviso }) => {
      const media = `média ${formatNotaInspecao(inspecao.mediaObtida)}`;
      if (inspecao.resultado === "APROVADA") {
        toast.success(`Inspeção aprovada · ${media}`);
      } else {
        toast.warning(`Inspeção reprovada · ${media}`);
      }
      if (aviso?.code === "IBC_ALOCADO_INAPTO") {
        toast.warning(
          `IBC alocado ficou Inapto: carga ${aviso.codCar}, pedido ${aviso.numPed}. A alocação foi mantida.`,
          { duration: 10000 },
        );
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["ibc", "pool"] }),
        queryClient.invalidateQueries({ queryKey: ["ibc", "alerts"] }),
      ]);
    },
    onError: (err) => {
      toast.error(toError(err).message || "Falha ao registrar inspeção");
    },
  });

  return {
    registrar: (ibcId: string, input: RegistrarIbcInspecaoInput): Promise<boolean> =>
      mutation.mutateAsync({ ibcId, input }).then(() => true, () => false),
    isPending: mutation.isPending,
  };
}
