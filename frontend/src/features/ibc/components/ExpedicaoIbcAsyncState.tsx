import type { ReactNode } from "react";
import IbcPageStatus from "./IbcPageStatus";

type Props = {
  loading: boolean;
  error: Error | null;
  loadingLabel?: string;
  children: ReactNode;
};

export default function ExpedicaoIbcAsyncState({
  loading,
  error,
  loadingLabel = "Carregando…",
  children,
}: Props) {
  if (loading) {
    return <IbcPageStatus status="loading" loadingLabel={loadingLabel} />;
  }
  if (error) {
    return <IbcPageStatus status="error" error={error} />;
  }
  return <>{children}</>;
}
