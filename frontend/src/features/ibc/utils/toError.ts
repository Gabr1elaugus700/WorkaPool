/**
 * Normaliza unknown catch values to Error for toast / UI state.
 */
export function toError(err: unknown): Error {
  if (err instanceof Error) return err;
  return new Error(String(err));
}
