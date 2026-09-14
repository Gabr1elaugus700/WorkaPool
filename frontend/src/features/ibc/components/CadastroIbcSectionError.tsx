import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

type Props = {
  message: string;
  onRetry: () => void;
};

/**
 * Erro + retry por seção no Cadastro IBC (não bloqueia a página).
 */
export default function CadastroIbcSectionError({ message, onRetry }: Props) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Erro ao carregar</AlertTitle>
      <AlertDescription className="flex flex-col gap-3">
        <span>{message}</span>
        <Button variant="outline" size="sm" className="w-fit" onClick={onRetry}>
          Tentar novamente
        </Button>
      </AlertDescription>
    </Alert>
  );
}
