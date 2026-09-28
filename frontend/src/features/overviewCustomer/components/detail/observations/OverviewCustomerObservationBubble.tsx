import { formatIsoDateTimeLabel } from "@/utils/formatDate";
import type { OverviewCustomerObservation } from "../../../types/overviewCustomerObservation.types";

type OverviewCustomerObservationBubbleProps = {
  observation: OverviewCustomerObservation;
  isOwn: boolean;
};

const AUTHOR_FALLBACK_LABEL = "Usuário";

export function OverviewCustomerObservationBubble({
  observation,
  isOwn,
}: OverviewCustomerObservationBubbleProps) {
  const authorLabel = observation.authorDisplayName.trim() || AUTHOR_FALLBACK_LABEL;
  const bubbleClassName = isOwn
    ? "ml-auto rounded-lg rounded-br-sm border border-primary/30 bg-primary/15"
    : "mr-auto rounded-lg rounded-bl-sm border border-border bg-muted/40";

  return (
    <div className="flex w-full" data-own={isOwn ? "true" : "false"}>
      <article className={`max-w-[80%] px-3 py-2 shadow-sm ${bubbleClassName}`}>
        <p className="text-xs font-semibold text-foreground">{authorLabel}</p>
        <p className="mt-1 whitespace-pre-wrap break-words text-sm text-foreground">
          {observation.body}
        </p>
        <p className="mt-1 text-right text-[11px] tabular-nums text-muted-foreground">
          <time dateTime={observation.createdAt}>
            {formatIsoDateTimeLabel(observation.createdAt)}
          </time>
          {observation.editedAt !== null ? <span> · editado</span> : null}
        </p>
      </article>
    </div>
  );
}
