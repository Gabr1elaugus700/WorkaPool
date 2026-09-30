import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useOverviewCustomerObservations } from "../../../hooks/useOverviewCustomerObservations";
import { OverviewCustomerObservationModalBody } from "./OverviewCustomerObservationModalBody";

type OverviewCustomerObservationModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerCode: number;
  tradeName: string;
  currentUserId: string;
};

export function OverviewCustomerObservationModal({
  open,
  onOpenChange,
  customerCode,
  tradeName,
  currentUserId,
}: OverviewCustomerObservationModalProps) {
  const observations = useOverviewCustomerObservations(customerCode, { open });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex h-[80vh] max-w-2xl flex-col gap-0 overflow-hidden p-0"
        onEscapeKeyDown={(event) => {
          if (observations.edit.editingId !== null) {
            event.preventDefault();
            observations.edit.onCancel();
          }
        }}
      >
        <DialogHeader className="border-b border-border px-5 py-4 pr-12">
          <DialogTitle className="truncate">{tradeName}</DialogTitle>
          <DialogDescription>Histórico de observações</DialogDescription>
        </DialogHeader>
        <OverviewCustomerObservationModalBody
          items={observations.items}
          currentUserId={currentUserId}
          isLoading={observations.isLoading}
          isError={observations.isError}
          onRetry={() => void observations.refetch()}
          draft={observations.draft}
          onDraftChange={observations.setDraft}
          onSubmit={observations.submit}
          canSubmit={observations.canSubmit}
          isSubmitting={observations.isSubmitting}
          submitError={observations.submitError}
          edit={observations.edit}
        />
      </DialogContent>
    </Dialog>
  );
}
