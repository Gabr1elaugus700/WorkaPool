import type { FormEvent, KeyboardEvent } from "react";
import { SendHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { shouldSubmitObservationOnKeyDown } from "../../../utils/overviewCustomerObservationComposer.utils";
import { OBSERVATION_BODY_MAX_LENGTH } from "../../../utils/overviewCustomerObservationsState.utils";

type OverviewCustomerObservationComposerProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  canSubmit: boolean;
  isSubmitting: boolean;
  error: string | null;
};

export function OverviewCustomerObservationComposer({
  value,
  onChange,
  onSubmit,
  canSubmit,
  isSubmitting,
  error,
}: OverviewCustomerObservationComposerProps) {
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
    if (canSubmit) {
      onSubmit();
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (canSubmit) {
      onSubmit();
    }
  };

  return (
    <form className="border-t border-border bg-background p-3" onSubmit={handleSubmit}>
      <div className="flex items-end gap-2">
        <textarea
          aria-label="Nova observação"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escreva uma observação (Shift+Enter quebra linha)"
          maxLength={OBSERVATION_BODY_MAX_LENGTH}
          rows={2}
          className="max-h-40 min-h-[44px] flex-1 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <Button type="submit" disabled={!canSubmit} aria-label="Enviar observação">
          <SendHorizontal aria-hidden="true" />
          {isSubmitting ? "Enviando…" : "Enviar"}
        </Button>
      </div>
      {error !== null ? (
        <p role="alert" className="mt-2 text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </form>
  );
}
