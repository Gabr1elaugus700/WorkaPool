import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";



export default function CriarChecklist() {
  const handleClick = () => {
    
  };

  return (
    <Button 
      variant="outline" 
      onClick={handleClick}
    >
      <Plus className="h-4 w-4 text-black-500" /> Criar Checklist
    </Button>
  );
}
