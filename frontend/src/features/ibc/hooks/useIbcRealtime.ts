import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/auth/AuthContext";
import { ibcExpedicaoService } from "../services/ibcExpedicaoService";
import {
  createIbcCargasQueryRefresher,
  startIbcRealtimeClient,
} from "../services/ibcRealtimeClient";
import { canAccessExpedicaoIbc } from "../utils/canAccessExpedicaoIbc";

export function useIbcRealtime(): void {
  const { user, token } = useAuth();
  const queryClient = useQueryClient();
  const allowed = canAccessExpedicaoIbc(user?.role);

  useEffect(() => {
    if (!allowed || !token) return undefined;

    const refresher = createIbcCargasQueryRefresher(queryClient);
    return startIbcRealtimeClient({
      openStream: (signal) => ibcExpedicaoService.openEventStream(token, signal),
      onInvalidate: refresher.invalidate,
      onReconnected: refresher.refetch,
    });
  }, [allowed, queryClient, token]);
}
