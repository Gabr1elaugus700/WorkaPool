import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { AppError } from "../../../../src/utils/AppError";
import { GrpproSyncScheduler } from "../../../../src/schedulers/grpproSync/GrpproSyncScheduler";

describe("GrpproSyncScheduler", () => {
  it("executes a sync run on each tick", async () => {
    let count = 0;
    const scheduler = new GrpproSyncScheduler({
      pipeline: {
        run: async () => {
          count += 1;
          return {
            published: true,
            rowCount: 10,
            run: {
              id: "run-1",
              status: "SUCCEEDED",
              startedAt: new Date(),
            },
          };
        },
      },
    });

    await scheduler.tick();
    assert.strictEqual(count, 1);
  });

  it("ignores overlapping ticks while a run is in flight", async () => {
    let count = 0;
    let releaseRun: (() => void) | null = null;
    const waitForRelease = new Promise<void>((resolve) => {
      releaseRun = resolve;
    });

    const scheduler = new GrpproSyncScheduler({
      pipeline: {
        run: async () => {
          count += 1;
          await waitForRelease;
          return {
            published: true,
            run: {
              id: "run-overlap",
              status: "SUCCEEDED",
              startedAt: new Date(),
            },
          };
        },
      },
    });

    const first = scheduler.tick();
    const second = scheduler.tick();

    assert.strictEqual(count, 1);
    releaseRun?.();
    await Promise.all([first, second]);
    assert.strictEqual(count, 1);
  });

  it("does not throw when pipeline reports an already-running sync", async () => {
    const scheduler = new GrpproSyncScheduler({
      pipeline: {
        run: async () => {
          throw new AppError({
            message: "already running",
            statusCode: 409,
            code: "GRPPRO_SYNC_ALREADY_RUNNING",
          });
        },
      },
    });

    await scheduler.tick();
    assert.ok(true);
  });
});
