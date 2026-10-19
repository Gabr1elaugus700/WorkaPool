import type { ReactNode } from "react";
import { Container } from "lucide-react";
import IbcPageHeader from "./IbcPageHeader";
import IbcPageTabs from "./IbcPageTabs";
import { gestaoIbcSections, type GestaoIbcSectionId } from "../utils/gestaoIbcSections";

type Props = {
  activeSection: GestaoIbcSectionId;
  userRole?: string;
  primaryAction?: ReactNode;
};

export default function GestaoIbcHeader({ activeSection, userRole, primaryAction }: Props) {
  return (
    <IbcPageHeader
      title="Gestão de IBC"
      icon={<Container className="h-7 w-7 text-primary" aria-hidden />}
      primaryAction={primaryAction}
      tabs={
        <IbcPageTabs
          tabs={gestaoIbcSections.tabs}
          activeId={activeSection}
          userRole={userRole}
          ariaLabel="Gestão de IBC"
        />
      }
    />
  );
}
