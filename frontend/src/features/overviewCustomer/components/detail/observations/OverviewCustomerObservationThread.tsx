import { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { OverviewCustomerObservation } from "../../../types/overviewCustomerObservation.types";
import { OverviewCustomerObservationBubble } from "./OverviewCustomerObservationBubble";

type OverviewCustomerObservationThreadProps = {
  items: OverviewCustomerObservation[];
  currentUserId: string;
};

export function OverviewCustomerObservationThread({
  items,
  currentUserId,
}: OverviewCustomerObservationThreadProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [items.length]);

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
        role="log"
        aria-label="Histórico de observações"
        className="flex flex-col gap-2 p-3"
      >
        {items.map((observation) => (
          <OverviewCustomerObservationBubble
            key={observation.id}
            observation={observation}
            isOwn={observation.authorUserId === currentUserId}
          />
        ))}
        <div ref={endRef} aria-hidden="true" />
      </div>
    </ScrollArea>
  );
}
