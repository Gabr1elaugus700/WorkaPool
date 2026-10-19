import { AlertCircle, Loader2 } from "lucide-react";
import DefaultLayout from "@/layout/DefaultLayout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export type IbcPageStatusProps =
  | { status: "loading"; loadingLabel?: string }
  | { status: "error"; error: Error }
  | { status: "empty"; title: string; nextStep: string };

export default function IbcPageStatus(props: IbcPageStatusProps) {
  if (props.status === "loading") {
    return (
      <DefaultLayout>
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">{props.loadingLabel ?? "Carregando…"}</p>
          </div>
        </div>
      </DefaultLayout>
    );
  }

  if (props.status === "error") {
    return (
      <DefaultLayout>
        <div className="w-full px-2 sm:px-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{props.error.message}</AlertDescription>
          </Alert>
        </div>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout>
      <div className="w-full px-2 sm:px-4">
        <h2 className="text-lg font-semibold text-foreground">{props.title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{props.nextStep}</p>
      </div>
    </DefaultLayout>
  );
}
