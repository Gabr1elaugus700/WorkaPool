import type { FormEvent, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import type { OverviewCustomerObservationEditControls } from "../../../types/overviewCustomerObservation.types";
import { shouldSubmitObservationOnKeyDown } from "../../../utils/overviewCustomerObservationComposer.utils";
import { OBSERVATION_BODY_MAX_LENGTH } from "../../../utils/overviewCustomerObservationsState.utils";

type OverviewCustomerObservationBubbleEditorProps = {
  edit: OverviewCustomerObservationEditControls;
};

export function OverviewCustomerObservationBubbleEditor({
  edit,
}: OverviewCustomerObservationBubbleEditorProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    const submitKey = shouldSubmitObservationOnKeyDown({
      key: event.key,
      shiftKey: event.shiftKey,
      isComposing: event.nativeEvent.isComposing,
    });
    if (!submitKey) {
      return;
    }
    event.preventDefault();
    edit.onSave();
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    edit.onSave();
  };

  return (
    <form className="mt-1 flex flex-col gap-2" onSubmit={handleSubmit}>
      <textarea
        aria-label="Editar observação"
        value={edit.draft}
        onChange={(event) => edit.onDraftChange(event.target.value)}
        onKeyDown={handleKeyDown}
        maxLength={OBSERVATION_BODY_MAX_LENGTH}
        rows={3}
        autoFocus
        className="max-h-40 min-h-[44px] w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      />
      {edit.error !== null ? (
        <p role="alert" className="text-xs text-destructive">
          {edit.error}
        </p>
      ) : null}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={edit.onCancel}>
          Cancelar
        </Button>
        <Button type="submit" size="sm" disabled={!edit.canSave}>
          {edit.isSaving ? "Salvando…" : "Salvar"}
        </Button>
      </div>
    </form>
  );
}
