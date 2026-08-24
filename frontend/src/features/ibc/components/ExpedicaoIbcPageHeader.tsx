import type { ReactNode } from "react";
import { Package } from "lucide-react";

type Props = {
  title?: string;
  children?: ReactNode;
};

/**
 * Cabeçalho das telas de expedição IBC (linguagem visual das cargas).
 */
export default function ExpedicaoIbcPageHeader({
  title = "Expedição IBC",
  children,
}: Props) {
  return (
    <div className="flex items-center bg-background justify-between mb-6">
      <div className="flex items-center gap-3">
        <Package className="h-7 w-7 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
      </div>
      {children}
    </div>
  );
}
