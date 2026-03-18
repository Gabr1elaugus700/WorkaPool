import { useDroppable } from "@dnd-kit/core";
import { Package } from "lucide-react";

type Props = {
  children: React.ReactNode;
};

export default function PedidoDropzone({ children }: Props) {
  const { setNodeRef } = useDroppable({ id: "pedidos" });

  return (
    <div
      ref={setNodeRef}
      className="border-2 rounded-lg p-6 mb-4 min-h-[100px] bg-muted shadow w-full col-span-2 flex flex-col items-center"
    >
      <div className="flex items-center gap-2 mb-4">
        <Package className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-bold text-foreground">Pedidos</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-h-[100px]">
        {children}
      </div>
    </div>
  );
}
