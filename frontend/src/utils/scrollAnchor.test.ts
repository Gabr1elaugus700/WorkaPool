import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { scrollTopAfterPrepend } from "./scrollAnchor";

describe("scrollTopAfterPrepend", () => {
  it("shifts the offset by the height added above the viewport", () => {
    assert.equal(
      scrollTopAfterPrepend({ previousScrollHeight: 2000, previousScrollTop: 0, nextScrollHeight: 2600 }),
      600,
    );
    assert.equal(
      scrollTopAfterPrepend({ previousScrollHeight: 2000, previousScrollTop: 120, nextScrollHeight: 2600 }),
      720,
    );
  });

  it("keeps the offset when nothing was added", () => {
    assert.equal(
      scrollTopAfterPrepend({ previousScrollHeight: 2000, previousScrollTop: 80, nextScrollHeight: 2000 }),
      80,
    );
  });
});
