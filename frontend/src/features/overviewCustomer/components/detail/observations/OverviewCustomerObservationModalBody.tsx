import { Button } from "@/components/ui/button";
import type { OverviewCustomerObservation } from "../../../types/overviewCustomerObservation.types";
import { OverviewCustomerObservationComposer } from "./OverviewCustomerObservationComposer";
import { OverviewCustomerObservationThread } from "./OverviewCustomerObservationThread";

type OverviewCustomerObservationModalBodyProps = {
  items: OverviewCustomerObservation[];
  currentUserId: string;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  draft: string;
  onDraftChange: (value: string) => void;
  onSubmit: () => void;
  canSubmit: boolean;
  isSubmitting: boolean;
  submitError: string | null;
};

export function OverviewCustomerObservationModalBody({
  items,
  currentUserId,
  isLoading,
  isError,
  onRetry,
  draft,
  onDraftChange,
  onSubmit,
  canSubmit,
  isSubmitting,
  submitError,
}: OverviewCustomerObservationModalBodyProps) {
  if (isLoading) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center p-6" aria-busy="true">
        <p className="text-sm text-muted-foreground">Carregando histórico…</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 p-6">
        <p role="alert" className="text-sm text-destructive">
          Não foi possível carregar o histórico
        </p>
        <Button type="button" variant="outline" size="sm" onClick={onRetry}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <>
      <OverviewCustomerObservationThread items={items} currentUserId={currentUserId} />
      <OverviewCustomerObservationComposer
        value={draft}
        onChange={onDraftChange}
        onSubmit={onSubmit}
        canSubmit={canSubmit}
        isSubmitting={isSubmitting}
        error={submitError}
      />
    </>
  );
}
