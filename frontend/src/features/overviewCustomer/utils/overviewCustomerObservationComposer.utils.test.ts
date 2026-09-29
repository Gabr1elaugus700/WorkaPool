import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { shouldSubmitObservationOnKeyDown } from "./overviewCustomerObservationComposer.utils";

describe("shouldSubmitObservationOnKeyDown", () => {
  it("submits on Enter without Shift", () => {
    assert.equal(
      shouldSubmitObservationOnKeyDown({ key: "Enter", shiftKey: false, isComposing: false }),
      true,
    );
  });

  it("does not submit on Shift+Enter so the textarea inserts a newline", () => {
    assert.equal(
      shouldSubmitObservationOnKeyDown({ key: "Enter", shiftKey: true, isComposing: false }),
      false,
    );
  });

  it("does not submit on other keys", () => {
    assert.equal(
      shouldSubmitObservationOnKeyDown({ key: "a", shiftKey: false, isComposing: false }),
      false,
    );
  });

  it("does not submit while an IME composition is in progress", () => {
    assert.equal(
      shouldSubmitObservationOnKeyDown({ key: "Enter", shiftKey: false, isComposing: true }),
      false,
    );
  });
});
