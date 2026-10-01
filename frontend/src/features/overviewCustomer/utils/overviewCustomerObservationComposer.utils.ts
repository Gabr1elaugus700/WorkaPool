export type ObservationComposerKeyInput = {
  key: string;
  shiftKey: boolean;
  isComposing: boolean;
};

export function shouldSubmitObservationOnKeyDown({
  key,
  shiftKey,
  isComposing,
}: ObservationComposerKeyInput): boolean {
  return key === "Enter" && !shiftKey && !isComposing;
}
