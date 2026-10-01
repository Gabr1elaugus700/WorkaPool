export type ScrollPrependSnapshot = {
  previousScrollHeight: number;
  previousScrollTop: number;
  nextScrollHeight: number;
};

/** Offset that keeps the same content in view after items are inserted above it. */
export function scrollTopAfterPrepend({
  previousScrollHeight,
  previousScrollTop,
  nextScrollHeight,
}: ScrollPrependSnapshot): number {
  return nextScrollHeight - previousScrollHeight + previousScrollTop;
}
