import type { ReactNode } from "react";
import { Package } from "lucide-react";
import ExpedicaoIbcSectionNav, {
  type ExpedicaoIbcSection,
} from "./ExpedicaoIbcSectionNav";

type Props = {
  title?: string;
  activeSection?: ExpedicaoIbcSection;
  children?: ReactNode;
};

/**
 * Cabeçalho das telas de expedição IBC (linguagem visual das cargas).
 */
export default function ExpedicaoIbcPageHeader({
  title = "Expedição IBC",
  activeSection,
  children,
}: Props) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 bg-background">
      <div className="flex items-center gap-3">
        <Package className="h-7 w-7 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {activeSection ? <ExpedicaoIbcSectionNav active={activeSection} /> : null}
        {children}
      </div>
    </div>
  );
}
