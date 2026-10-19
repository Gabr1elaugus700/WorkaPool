import type { ReactNode } from "react";
import { Package } from "lucide-react";
import IbcPageHeader from "./IbcPageHeader";
import ExpedicaoIbcSectionNav, { type ExpedicaoIbcSection } from "./ExpedicaoIbcSectionNav";

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
      tabs={activeSection ? <ExpedicaoIbcSectionNav active={activeSection} /> : undefined}
    >
      {children}
    </IbcPageHeader>
  );
}
