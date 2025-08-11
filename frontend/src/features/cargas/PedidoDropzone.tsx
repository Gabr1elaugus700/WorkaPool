import { useDroppable } from "@dnd-kit/core";

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
      <h1 className="text-2xl font-bold mb-4 text-center text-foreground">Pedidos</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
        {children}
      </div>
    </div>
  );
}
