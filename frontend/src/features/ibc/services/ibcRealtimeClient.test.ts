import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { QueryClient, QueryObserver } from "@tanstack/react-query";
import {
  IBC_CARGAS_EXPEDICAO_QUERY_KEY,
  createIbcCargasQueryRefresher,
  parseIbcSseBlock,
  startIbcRealtimeClient,
} from "./ibcRealtimeClient";
import { ibcExpedicaoService } from "./ibcExpedicaoService";

type ControlledStream = {
  response: Response;
  push(text: string): void;
  end(): void;
};

function createControlledStream(): ControlledStream {
  const encoder = new TextEncoder();
  let controller: ReadableStreamDefaultController<Uint8Array> | null = null;
  const body = new ReadableStream<Uint8Array>({
    start(streamController) {
      controller = streamController;
    },
  });
  return {
    response: new Response(body, {
      status: 200,
      headers: { "Content-Type": "text/event-stream" },
    }),
    push: (text) => controller?.enqueue(encoder.encode(text)),
    end: () => controller?.close(),
  };
}

function cargaFechadaBlock(codCar: number): string {
  const data = JSON.stringify({
    event: "CARGA_FECHADA",
    cargaId: `carga-${codCar}`,
    codCar,
  });
  return `event: CARGA_FECHADA\ndata: ${data}\n\n`;
}

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

async function waitFor(condition: () => boolean, timeoutMs = 1000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (condition()) return;
    await sleep(5);
  }
  throw new Error(`Condição não atendida em ${timeoutMs}ms`);
}

const stops: Array<() => void> = [];

afterEach(() => {
  for (const stop of stops.splice(0)) stop();
});

describe("parseIbcSseBlock", () => {
  it("parses a CARGA_FECHADA block", () => {
    assert.deepEqual(parseIbcSseBlock(cargaFechadaBlock(11).trim()), {
      event: "CARGA_FECHADA",
      cargaId: "carga-11",
      codCar: 11,
    });
  });

  it("ignores other events, comments and malformed data", () => {
    assert.equal(parseIbcSseBlock(": connected"), null);
    assert.equal(parseIbcSseBlock('event: OUTRO\ndata: {"codCar":1}'), null);
    assert.equal(parseIbcSseBlock("event: CARGA_FECHADA\ndata: {invalid"), null);
    assert.equal(
      parseIbcSseBlock('event: CARGA_FECHADA\ndata: {"event":"CARGA_FECHADA","codCar":"1"}'),
      null,
    );
  });
});

describe("startIbcRealtimeClient", () => {
  it("invalidates once when CARGA_FECHADA arrives through SSE", async () => {
    const stream = createControlledStream();
    let invalidations = 0;
    stops.push(
      startIbcRealtimeClient({
        openStream: async () => stream.response,
        onInvalidate: () => {
          invalidations += 1;
        },
        onReconnected: () => undefined,
        debounceMs: 10,
      }),
    );

    stream.push(": connected\n\n");
    stream.push(cargaFechadaBlock(21));
    await waitFor(() => invalidations === 1);
    await sleep(30);

    assert.equal(invalidations, 1);
  });

  it("coalesces several CARGA_FECHADA events inside the debounce window into one refetch", async () => {
    const stream = createControlledStream();
    let invalidations = 0;
    stops.push(
      startIbcRealtimeClient({
        openStream: async () => stream.response,
        onInvalidate: () => {
          invalidations += 1;
        },
        onReconnected: () => undefined,
        debounceMs: 40,
      }),
    );

    stream.push(cargaFechadaBlock(31));
    stream.push(cargaFechadaBlock(32) + cargaFechadaBlock(33));
    await sleep(10);
    stream.push(cargaFechadaBlock(34));
    await waitFor(() => invalidations >= 1);
    await sleep(60);

    assert.equal(invalidations, 1);
  });

  it("ignores blocks that are not CARGA_FECHADA notifications", async () => {
    const stream = createControlledStream();
    let invalidations = 0;
    stops.push(
      startIbcRealtimeClient({
        openStream: async () => stream.response,
        onInvalidate: () => {
          invalidations += 1;
        },
        onReconnected: () => undefined,
        debounceMs: 5,
      }),
    );

    stream.push(": connected\n\nevent: OUTRO\ndata: {}\n\nevent: CARGA_FECHADA\ndata: {x\n\n");
    await sleep(30);

    assert.equal(invalidations, 0);
  });

  it("refetches the cargo list when the connection is restored, not on the first connection", async () => {
    const first = createControlledStream();
    const second = createControlledStream();
    const responses = [first.response, second.response];
    let opened = 0;
    let reconnections = 0;
    stops.push(
      startIbcRealtimeClient({
        openStream: async () => {
          const response = responses[opened];
          opened += 1;
          if (!response) throw new Error("sem mais streams");
          return response;
        },
        onInvalidate: () => undefined,
        onReconnected: () => {
          reconnections += 1;
        },
        reconnectDelayMs: 5,
      }),
    );

    await waitFor(() => opened === 1);
    assert.equal(reconnections, 0);

    first.end();
    await waitFor(() => opened === 2);
    await waitFor(() => reconnections === 1);
    assert.equal(reconnections, 1);
  });
});

describe("createIbcCargasQueryRefresher with React Query", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("CARGA_FECHADA invalidates the IBC cargo query and requests GET /api/ibc/cargas-expedicao", async () => {
    if (!("localStorage" in globalThis)) {
      Object.defineProperty(globalThis, "localStorage", {
        value: { getItem: () => null },
        configurable: true,
      });
    }
    const requestedUrls: string[] = [];
    globalThis.fetch = async (input: RequestInfo | URL): Promise<Response> => {
      requestedUrls.push(String(input));
      return new Response("[]", {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    };

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const observer = new QueryObserver(queryClient, {
      queryKey: IBC_CARGAS_EXPEDICAO_QUERY_KEY,
      queryFn: ibcExpedicaoService.listCargasExpedicao,
    });
    const unsubscribe = observer.subscribe(() => undefined);
    stops.push(() => {
      unsubscribe();
      queryClient.clear();
    });
    await waitFor(() => requestedUrls.length === 1);

    const stream = createControlledStream();
    const refresher = createIbcCargasQueryRefresher(queryClient);
    stops.push(
      startIbcRealtimeClient({
        openStream: async () => stream.response,
        onInvalidate: refresher.invalidate,
        onReconnected: refresher.refetch,
        debounceMs: 10,
      }),
    );

    stream.push(cargaFechadaBlock(41));
    await waitFor(() => requestedUrls.length === 2);

    assert.match(requestedUrls[1] ?? "", /\/api\/ibc\/cargas-expedicao$/);
  });
});
