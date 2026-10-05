import assert from "node:assert/strict";
import http from "node:http";
import type { AddressInfo } from "node:net";
import { after, before, describe, it } from "node:test";
import express from "express";
import jwt from "jsonwebtoken";
import type { CargoClosedEvent } from "../../../../../src/features/events/domainEvents";
import ibcRoutes from "../../../../../src/features/ibc/http/routes/IbcRoute";
import { ibcSseGateway } from "../../../../../src/features/ibc/realtime/ibcSseGateway";

type OpenedStream = {
  response: http.IncomingMessage;
  nextChunkContaining(text: string): Promise<string>;
  close(): void;
};

const cargoClosedEvent: CargoClosedEvent = {
  eventId: "33333333-3333-4333-8333-333333333333",
  eventType: "CARGA_FECHADA",
  occurredAt: "2026-10-05T12:00:00.000Z",
  payload: {
    cargaId: "44444444-4444-4444-8444-444444444444",
    codCar: 74300,
  },
};

function createToken(role: string): string {
  return jwt.sign({ id: "user-sse", role }, "dev_secret");
}

describe("IBC SSE stream (#74)", () => {
  let server: http.Server;
  let port: number;

  const openStream = (token?: string): Promise<OpenedStream> =>
    new Promise((resolve, reject) => {
      const request = http.request(
        {
          host: "127.0.0.1",
          port,
          path: "/api/ibc/events",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        },
        (response) => {
          response.setEncoding("utf8");
          let received = "";
          const waiters: Array<{ text: string; resolve: (value: string) => void }> = [];
          response.on("data", (chunk: string) => {
            received += chunk;
            for (const waiter of [...waiters]) {
              if (received.includes(waiter.text)) {
                waiters.splice(waiters.indexOf(waiter), 1);
                waiter.resolve(received);
              }
            }
          });
          resolve({
            response,
            nextChunkContaining: (text) =>
              new Promise((resolveChunk) => {
                if (received.includes(text)) resolveChunk(received);
                else waiters.push({ text, resolve: resolveChunk });
              }),
            close: () => request.destroy(),
          });
        },
      );
      request.on("error", (error: NodeJS.ErrnoException) => {
        if (error.code !== "ECONNRESET") reject(error);
      });
      request.end();
    });

  before(async () => {
    const app = express();
    app.use(express.json());
    app.use("/api/ibc", ibcRoutes);
    server = app.listen(0);
    await new Promise<void>((resolve) => server.once("listening", resolve));
    port = (server.address() as AddressInfo).port;
  });

  after(async () => {
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it("accepts an authenticated IBC user with text/event-stream", async () => {
    for (const role of ["ALMOX", "LOGISTICA", "ADMIN"]) {
      const stream = await openStream(createToken(role));
      try {
        assert.equal(stream.response.statusCode, 200);
        assert.match(
          String(stream.response.headers["content-type"]),
          /^text\/event-stream/,
        );
        await stream.nextChunkContaining(": connected");
      } finally {
        stream.close();
      }
    }
  });

  it("rejects the stream without a valid JWT with 401", async () => {
    const anonymous = await openStream();
    const invalid = await openStream("not-a-jwt");
    try {
      assert.equal(anonymous.response.statusCode, 401);
      assert.equal(invalid.response.statusCode, 401);
    } finally {
      anonymous.close();
      invalid.close();
    }
  });

  it("broadcasts only change information for CARGA_FECHADA", async () => {
    const stream = await openStream(createToken("ALMOX"));
    try {
      await stream.nextChunkContaining(": connected");

      ibcSseGateway.broadcast(cargoClosedEvent);
      const received = await stream.nextChunkContaining(
        `"codCar":${cargoClosedEvent.payload.codCar}}\n\n`,
      );
      const block = received
        .split("\n\n")
        .find((item) => item.startsWith("event: CARGA_FECHADA"));
      assert.ok(block, "SSE block for CARGA_FECHADA should be emitted");

      const dataLine = block.split("\n").find((line) => line.startsWith("data: "));
      assert.ok(dataLine);
      const data: unknown = JSON.parse(dataLine.slice("data: ".length));
      assert.deepEqual(data, {
        event: "CARGA_FECHADA",
        cargaId: cargoClosedEvent.payload.cargaId,
        codCar: cargoClosedEvent.payload.codCar,
      });
    } finally {
      stream.close();
    }
  });
});
