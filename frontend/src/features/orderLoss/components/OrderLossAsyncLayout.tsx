import { ReactNode } from "react";
import DefaultLayout from "@/layout/DefaultLayout";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type Props = {
  loading: boolean;
  error: Error | null;
  loadingLabel?: string;
  children: ReactNode;
  /** Altura mínima da área de loading/erro */
  contentMinHeightClass?: string;
};

/**
 * Layout compartilhado: loading e erro para telas de pedidos perdidos (gestor / vendedor).
 */
export function OrderLossAsyncLayout({
  loading,
  error,
  loadingLabel = "Carregando...",
  children,
  contentMinHeightClass = "min-h-[60vh]",
}: Props) {
  if (loading) {
    return (
      <DefaultLayout>
        <div
          className={`flex items-center justify-center ${contentMinHeightClass}`}
        >
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-gray-600">{loadingLabel}</p>
          </div>
        </div>
      </DefaultLayout>
    );
  }

  if (error) {
    return (
      <DefaultLayout>
        <div className={`w-full mx-auto px-2 sm:px-4 ${contentMinHeightClass}`}>
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
