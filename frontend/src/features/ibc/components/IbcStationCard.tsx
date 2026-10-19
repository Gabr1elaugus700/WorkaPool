import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { expedicaoIbcStationTone, type ExpedicaoIbcSection } from "../utils/expedicaoIbcSections";

type Props = {
  station: ExpedicaoIbcSection;
  title: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
};

export default function IbcStationCard({ station, title, meta, actions, children }: Props) {
  const tone = expedicaoIbcStationTone[station];

  return (
    <article className="flex flex-col overflow-hidden rounded-lg border bg-card shadow-sm">
      <div className={cn("h-1.5", tone.stripeClass)} aria-hidden />
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <h2 className="min-w-0 text-lg font-semibold leading-snug text-foreground">{title}</h2>
          <span
            className={cn(
              "shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
              tone.badgeClass,
            )}
          >
            {tone.label}
          </span>
        </div>
        {meta ? <div className="text-xs text-muted-foreground">{meta}</div> : null}
        {children ? <div className="flex-1 text-sm">{children}</div> : null}
        {actions ? <div className="mt-auto flex flex-wrap items-center justify-end gap-2 pt-1">{actions}</div> : null}
      </div>
    </article>
  );
}
