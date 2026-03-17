import { Truck } from "lucide-react";

type Props = {
  children?: React.ReactNode;
};

/**
 * Cabeçalho da página de gestão de cargas
 */
export default function CargasPageHeader({ children }: Props) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <Truck className="h-7 w-7 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">
          Gestão de Cargas
        </h1>
      </div>
      {children}
    </div>
  );
}
