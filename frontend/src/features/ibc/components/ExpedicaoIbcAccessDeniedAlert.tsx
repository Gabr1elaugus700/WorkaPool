import DefaultLayout from "@/layout/DefaultLayout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

type Props = {
  /**
   * Alvo com artigo, ex.: "a Expedição IBC" | "o Cadastro IBC".
   */
  targetPhrase?: string;
};

/**
 * Alert de acesso negado para telas IBC restritas a ALMOX/ADMIN.
 */
export default function ExpedicaoIbcAccessDeniedAlert({
  targetPhrase = "a Expedição IBC",
}: Props) {
  return (
    <DefaultLayout>
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Acesso negado</AlertTitle>
        <AlertDescription>
          Apenas ALMOX e ADMIN podem acessar {targetPhrase}.
        </AlertDescription>
      </Alert>
    </DefaultLayout>
  );
}
