import { AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export type IbcStatusContentProps =
  | { status: "loading"; loadingLabel?: string }
  | { status: "error"; error: Error }
  | { status: "empty"; title: string; nextStep: string };

export default function IbcStatusContent(props: IbcStatusContentProps) {
  if (props.status === "loading") {
    return (
      <div className="flex min-h-[40vh] items-center justify-center" role="status">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">{props.loadingLabel ?? "Carregando…"}</p>
        </div>
      </div>
    );
  }

  if (props.status === "error") {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Erro</AlertTitle>
        <AlertDescription>{props.error.message}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-foreground">{props.title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{props.nextStep}</p>
    </div>
  );
}
