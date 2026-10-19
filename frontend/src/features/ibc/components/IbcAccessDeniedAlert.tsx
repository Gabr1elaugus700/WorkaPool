import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { formatIbcAccessDeniedText } from "../utils/formatIbcAccessDeniedText";

type Props = {
  requiredRoles: readonly string[];
  targetPhrase: string;
};

export default function IbcAccessDeniedAlert({ requiredRoles, targetPhrase }: Props) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Acesso negado</AlertTitle>
      <AlertDescription>
        {formatIbcAccessDeniedText(requiredRoles, targetPhrase)}
      </AlertDescription>
    </Alert>
  );
}
