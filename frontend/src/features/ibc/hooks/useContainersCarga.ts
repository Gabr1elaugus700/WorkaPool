import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/auth/AuthContext";
import { ibcExpedicaoService } from "../services/ibcExpedicaoService";
import { canAccessExpedicaoIbc } from "../utils/canAccessExpedicaoIbc";

export function containersCargaQueryKey(codCar: number | null) {
  return ["ibc", "containers-carga", codCar] as const;
}

export function useContainersCarga(codCar: number | null) {
  const { user } = useAuth();
  const allowed = canAccessExpedicaoIbc(user?.role);
  const enabled = allowed && codCar != null && Number.isFinite(codCar);
  const query = useQuery({
    queryKey: containersCargaQueryKey(codCar),
    queryFn: () => {
      if (codCar == null) {
        return Promise.reject(new Error("Código de carga inválido."));
      }
      return ibcExpedicaoService.getContainersCarga(codCar);
    },
    enabled,
  });
  return { allowed, ...query };
}
