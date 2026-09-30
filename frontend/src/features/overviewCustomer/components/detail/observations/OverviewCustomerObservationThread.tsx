import { useEffect, useLayoutEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { scrollTopAfterPrepend } from "@/utils/scrollAnchor";
import type {
  OverviewCustomerObservation,
  OverviewCustomerObservationEditControls,
} from "../../../types/overviewCustomerObservation.types";
import { OverviewCustomerObservationBubble } from "./OverviewCustomerObservationBubble";

type OverviewCustomerObservationThreadProps = {
  items: OverviewCustomerObservation[];
  currentUserId: string;
  edit?: OverviewCustomerObservationEditControls;
  hasOlder?: boolean;
  isLoadingOlder?: boolean;
  onLoadOlder?: () => void;
};

type ScrollSnapshot = { scrollHeight: number; scrollTop: number };

function findViewport(node: HTMLElement | null): HTMLElement | null {
  return node?.closest<HTMLElement>("[data-radix-scroll-area-viewport]") ?? null;
}

export function OverviewCustomerObservationThread({
  items,
  currentUserId,
  edit,
  hasOlder = false,
  isLoadingOlder = false,
  onLoadOlder,
}: OverviewCustomerObservationThreadProps) {
  const logRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const scrollSnapshotRef = useRef<ScrollSnapshot | null>(null);

  const firstId = items[0]?.id;
  const lastId = items[items.length - 1]?.id;

  useLayoutEffect(() => {
    const snapshot = scrollSnapshotRef.current;
    const viewport = findViewport(logRef.current);
    if (!snapshot || !viewport) {
      return;
    }
    scrollSnapshotRef.current = null;
    viewport.scrollTop = scrollTopAfterPrepend({
      previousScrollHeight: snapshot.scrollHeight,
      previousScrollTop: snapshot.scrollTop,
      nextScrollHeight: viewport.scrollHeight,
    });
  }, [firstId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [lastId]);

  const handleLoadOlder = () => {
    const viewport = findViewport(logRef.current);
    scrollSnapshotRef.current = viewport
      ? { scrollHeight: viewport.scrollHeight, scrollTop: viewport.scrollTop }
      : null;
    onLoadOlder?.();
  };

  if (items.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center p-6">
        <p className="text-sm text-muted-foreground">Nenhuma observação neste cliente</p>
      </div>
    );
  }

  return (
    <ScrollArea className="min-h-0 flex-1">
      <div
        ref={logRef}
        role="log"
        aria-label="Histórico de observações"
        className="flex flex-col gap-2 p-3"
      >
        {hasOlder ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="self-center text-muted-foreground"
            disabled={isLoadingOlder}
            onClick={handleLoadOlder}
          >
            {isLoadingOlder ? "Carregando…" : "Carregar observações anteriores"}
          </Button>
        ) : null}
        {items.map((observation) => (
          <OverviewCustomerObservationBubble
            key={observation.id}
            observation={observation}
            isOwn={observation.authorUserId === currentUserId}
            edit={edit}
          />
        ))}
        <div ref={endRef} aria-hidden="true" />
      </div>
    </ScrollArea>
  );
}
