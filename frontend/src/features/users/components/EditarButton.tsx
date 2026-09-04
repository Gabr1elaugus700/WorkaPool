import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EditButtonProps {
  userId: string;
  userLogin: string;
  onEdit: (userId: string) => void;
}

export default function EditButton({ userId, userLogin, onEdit }: EditButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => onEdit(userId)}
      aria-label={`Editar ${userLogin}`}
    >
      <Pencil className="h-4 w-4" />
      Editar
    </Button>
  );
}
