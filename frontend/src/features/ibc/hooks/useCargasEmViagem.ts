import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/auth/AuthContext";
import { ibcExpedicaoService } from "../services/ibcExpedicaoService";
import { IBC_CARGAS_EM_VIAGEM_QUERY_KEY } from "../services/ibcRealtimeClient";
import { canAccessExpedicaoIbc } from "../utils/canAccessExpedicaoIbc";
import { useIbcRealtime } from "./useIbcRealtime";

export function useCargasEmViagem() {
  const { user } = useAuth();
  const allowed = canAccessExpedicaoIbc(user?.role);
  const query = useQuery({
    queryKey: IBC_CARGAS_EM_VIAGEM_QUERY_KEY,
    queryFn: ibcExpedicaoService.listCargasEmViagem,
    enabled: allowed,
  });
  useIbcRealtime();
  return { allowed, ...query };
}
