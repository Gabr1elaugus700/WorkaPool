import type { IbcStatusContentProps } from "../components/IbcStatusContent";
import { toError } from "./toError";

type Input = {
  isLoading: boolean;
  error: unknown;
  isEmpty: boolean;
  loadingLabel: string;
  empty: { title: string; nextStep: string };
};

export function resolveIbcTabStatus({
  isLoading,
  error,
  isEmpty,
  loadingLabel,
  empty,
}: Input): IbcStatusContentProps | null {
  if (isLoading) return { status: "loading", loadingLabel };
  if (error) return { status: "error", error: toError(error) };
  if (isEmpty) return { status: "empty", ...empty };
  return null;
}
