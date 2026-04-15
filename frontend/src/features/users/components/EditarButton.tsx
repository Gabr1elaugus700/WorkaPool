import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EditButtonProps {
  userId: string;
  onEdit: (userId: string) => void;
}

export default function EditButton({ userId, onEdit }: EditButtonProps) {
  const handleClick = () => {
    onEdit(userId);
  };

  return (
    <Button 
      variant="outline" 
      className="h-8 w-8 p-0" 
      onClick={handleClick}
    >
      <Pencil className="h-4 w-4 text-blue-500" />
    </Button>
  );
}
