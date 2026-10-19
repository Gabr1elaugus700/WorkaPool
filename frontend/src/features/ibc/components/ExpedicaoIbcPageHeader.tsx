import type { ReactNode } from "react";
import { Package } from "lucide-react";
import IbcPageHeader from "./IbcPageHeader";
import IbcPageTabs from "./IbcPageTabs";
import { EXPEDICAO_IBC_SECTIONS, type ExpedicaoIbcSection } from "../utils/expedicaoIbcSections";

type Props = {
  title?: string;
  activeSection?: ExpedicaoIbcSection;
  children?: ReactNode;
};

export default function ExpedicaoIbcPageHeader({
  title = "Expedição IBC",
  activeSection,
  children,
}: Props) {
  return (
    <IbcPageHeader
      title={title}
      icon={<Package className="h-7 w-7 text-primary" />}
      tabs={
        activeSection ? (
          <IbcPageTabs tabs={EXPEDICAO_IBC_SECTIONS} activeId={activeSection} ariaLabel="Expedição IBC" />
        ) : undefined
      }
    >
      {children}
    </IbcPageHeader>
  );
}
