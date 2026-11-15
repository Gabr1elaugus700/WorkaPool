import type { ReactNode } from "react";
import { Package } from "lucide-react";
import DefaultLayout from "@/layout/DefaultLayout";
import IbcPageHeader from "./IbcPageHeader";
import ExpedicaoIbcPageTabs from "./ExpedicaoIbcPageTabs";
import IbcStatusContent, { type IbcStatusContentProps } from "./IbcStatusContent";
import { useExpedicaoIbcTabCounts } from "../hooks/useExpedicaoIbcTabCounts";
import { useIbcRealtime } from "../hooks/useIbcRealtime";
import type { ExpedicaoIbcSection } from "../utils/expedicaoIbcSections";

type Props = {
  activeSection: ExpedicaoIbcSection;
  description: string;
  /** `null` quando a aba tem itens para mostrar. */
  status: IbcStatusContentProps | null;
  children?: ReactNode;
};

export default function ExpedicaoIbcTabShell({ activeSection, description, status, children }: Props) {
  const { counts } = useExpedicaoIbcTabCounts();
  useIbcRealtime();

  return (
    <DefaultLayout>
      <IbcPageHeader
        title="Expedição IBC"
        icon={<Package className="h-7 w-7 text-primary" aria-hidden />}
        tabs={<ExpedicaoIbcPageTabs activeId={activeSection} counts={counts} />}
      />
      <p className="mb-4 max-w-prose text-sm text-muted-foreground">{description}</p>
      {status ? (
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <IbcStatusContent {...status} />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{children}</div>
      )}
    </DefaultLayout>
  );
}
