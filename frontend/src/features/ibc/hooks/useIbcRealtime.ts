import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/auth/AuthContext";
import { getBaseUrl } from "@/lib/apiBase";
import type { IbcRealtimeNotification } from "../types/ibcExpedicao.types";
import { canAccessExpedicaoIbc } from "../utils/canAccessExpedicaoIbc";

const IBC_CARGAS_QUERY_KEY = ["ibc", "cargas-expedicao"] as const;
const DEBOUNCE_MS = 250;
const RECONNECT_DELAY_MS = 1000;

function isIbcRealtimeNotification(
  value: unknown,
): value is IbcRealtimeNotification {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    record.event === "CARGA_FECHADA" &&
    typeof record.cargaId === "string" &&
    typeof record.codCar === "number"
  );
}

function parseSseBlock(block: string): IbcRealtimeNotification | null {
  const lines = block.split(/\r?\n/);
  const eventName = lines
    .find((line) => line.startsWith("event:"))
    ?.slice("event:".length)
    .trim();
  const data = lines
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice("data:".length).trim())
    .join("\n");

  if (eventName !== "CARGA_FECHADA" || !data) return null;

  try {
    const parsed: unknown = JSON.parse(data);
    return isIbcRealtimeNotification(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

async function consumeSse(
  response: Response,
  signal: AbortSignal,
  onEvent: (event: IbcRealtimeNotification) => void,
): Promise<void> {
  if (!response.body) {
    throw new Error("Stream SSE sem corpo");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (!signal.aborted) {
    const result = await reader.read();
    if (result.done) break;

    buffer += decoder.decode(result.value, { stream: true });
    const blocks = buffer.split(/\r?\n\r?\n/);
    buffer = blocks.pop() ?? "";
    for (const block of blocks) {
      const event = parseSseBlock(block);
      if (event) onEvent(event);
    }
  }
}

export function useIbcRealtime(): void {
  const { user, token } = useAuth();
  const queryClient = useQueryClient();
  const allowed = canAccessExpedicaoIbc(user?.role);

  useEffect(() => {
    if (!allowed || !token) return undefined;

    const controller = new AbortController();
    let reconnecting = false;
    let refreshTimer: ReturnType<typeof setTimeout> | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const scheduleRefresh = (): void => {
      if (refreshTimer) return;
      refreshTimer = setTimeout(() => {
        refreshTimer = null;
        void queryClient.invalidateQueries({
          queryKey: IBC_CARGAS_QUERY_KEY,
        });
      }, DEBOUNCE_MS);
    };

    const waitBeforeReconnect = (): Promise<void> =>
      new Promise((resolve) => {
        reconnectTimer = setTimeout(resolve, RECONNECT_DELAY_MS);
      });

    const connect = async (): Promise<void> => {
      while (!controller.signal.aborted) {
        try {
          const response = await fetch(`${getBaseUrl()}/api/ibc/events`, {
            headers: { Authorization: `Bearer ${token}` },
            signal: controller.signal,
          });
          if (!response.ok) {
            throw new Error(`SSE indisponível: HTTP ${response.status}`);
          }

          if (reconnecting) {
            void queryClient.refetchQueries({
              queryKey: IBC_CARGAS_QUERY_KEY,
            });
          }
          reconnecting = true;
          await consumeSse(response, controller.signal, scheduleRefresh);
        } catch (error: unknown) {
          if (controller.signal.aborted) return;
          console.warn(
            "Conexão SSE IBC interrompida:",
            error instanceof Error ? error.message : error,
          );
        }

        if (!controller.signal.aborted) {
          await waitBeforeReconnect();
        }
      }
    };

    void connect();

    return () => {
      controller.abort();
      if (refreshTimer) clearTimeout(refreshTimer);
      if (reconnectTimer) clearTimeout(reconnectTimer);
    };
  }, [allowed, queryClient, token]);
}
