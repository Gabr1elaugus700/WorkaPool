import DefaultLayout from "@/layout/DefaultLayout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

/**
 * Alert de acesso negado para telas de Expedição IBC (ALMOX/ADMIN).
 */
export default function ExpedicaoIbcAccessDeniedAlert() {
  return (
    <DefaultLayout>
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Acesso negado</AlertTitle>
        <AlertDescription>
          Apenas ALMOX e ADMIN podem acessar a Expedição IBC.
        </AlertDescription>
      </Alert>
    </DefaultLayout>
  );
}
