import { ReactNode } from "react";
import DefaultLayout from "@/layout/DefaultLayout";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type Props = {
  loading: boolean;
  error: Error | null;
  loadingLabel?: string;
  children: ReactNode;
};

/**
 * Loading / erro compartilhados das telas de expedição IBC.
 */
export default function ExpedicaoIbcAsyncState({
  loading,
  error,
  loadingLabel = "Carregando…",
  children,
}: Props) {
  if (loading) {
    return (
      <DefaultLayout>
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">{loadingLabel}</p>
          </div>
        </div>
      </DefaultLayout>
    );
  }

  if (error) {
    return (
      <DefaultLayout>
        <div className="w-full px-2 sm:px-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        </div>
      </DefaultLayout>
    );
  }

  return <>{children}</>;
}
