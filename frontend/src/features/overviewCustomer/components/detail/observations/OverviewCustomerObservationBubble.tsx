import { Pencil } from "lucide-react";
import { formatIsoDateTimeLabel } from "@/utils/formatDate";
import type {
  OverviewCustomerObservation,
  OverviewCustomerObservationEditControls,
} from "../../../types/overviewCustomerObservation.types";
import { OverviewCustomerObservationBubbleEditor } from "./OverviewCustomerObservationBubbleEditor";

type OverviewCustomerObservationBubbleProps = {
  observation: OverviewCustomerObservation;
  isOwn: boolean;
  edit?: OverviewCustomerObservationEditControls;
};

const AUTHOR_FALLBACK_LABEL = "Usuário";

export function OverviewCustomerObservationBubble({
  observation,
  isOwn,
  edit,
}: OverviewCustomerObservationBubbleProps) {
  const authorLabel = observation.authorDisplayName.trim() || AUTHOR_FALLBACK_LABEL;
  const bubbleClassName = isOwn
    ? "ml-auto rounded-lg rounded-br-sm border border-primary/30 bg-primary/15"
    : "mr-auto rounded-lg rounded-bl-sm border border-border bg-muted/40";
  const editControls = isOwn ? edit : undefined;
  const isEditing = editControls?.editingId === observation.id;

  return (
    <div className="flex w-full" data-own={isOwn ? "true" : "false"}>
      <article
        className={`max-w-[80%] px-3 py-2 shadow-sm ${isEditing ? "w-full" : ""} ${bubbleClassName}`}
      >
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold text-foreground">{authorLabel}</p>
          {editControls && !isEditing ? (
            <button
              type="button"
              aria-label="Editar observação"
              onClick={() => editControls.onStart(observation)}
              className="rounded p-1 text-muted-foreground hover:bg-background/60 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <Pencil className="size-3.5" aria-hidden="true" />
            </button>
          ) : null}
        </div>
        {editControls && isEditing ? (
          <OverviewCustomerObservationBubbleEditor edit={editControls} />
        ) : (
          <p className="mt-1 whitespace-pre-wrap break-words text-sm text-foreground">
            {observation.body}
          </p>
        )}
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
